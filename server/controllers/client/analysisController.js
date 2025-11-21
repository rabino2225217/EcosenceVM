const axios = require("axios");
const FormData = require("form-data");
const mongoose = require("mongoose");
const fs = require("fs");
const Project = require("../../models/project-model");
const Detection = require("../../models/detection-model");
const Summary = require("../../models/summary-model");

const MODEL_API_URL =
  process.env.MODEL_API_URL || "http://localhost:5001/predict";

//Analyze image
exports.analyzeImage = async (req, res) => {
  const tempFile = req.file?.path;
  try {
    // Verify file exists and is readable
    if (tempFile && !fs.existsSync(tempFile)) {
      return res.status(400).json({ error: "Uploaded file not found." });
    }
    if (tempFile) {
      try {
        fs.accessSync(tempFile, fs.constants.R_OK);
      } catch (err) {
        console.error("File permission error:", err);
        return res.status(500).json({ error: "File permission error. Please check uploads directory permissions." });
      }
    }
    const {
      project_id: projectIdRaw,
      model: modelKey,
      confidence,
      iou,
    } = req.body;

    if (!projectIdRaw)
      return res.status(400).json({ error: "project_id is required" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    if (!modelKey) return res.status(400).json({ error: "model is required" });

    const projectId = new mongoose.Types.ObjectId(projectIdRaw);
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists)
      return res.status(404).json({ error: "Project does not exist." });

    //Prepare stream for Flask
    // Ensure file is readable before creating stream
    try {
      fs.accessSync(tempFile, fs.constants.R_OK);
    } catch (err) {
      console.error("Cannot read uploaded file:", err);
      return res.status(500).json({ error: "Cannot read uploaded file. Permission issue." });
    }
    
    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempFile));
    formData.append("model", modelKey);
    formData.append("confidence", confidence ?? 0.5);
    formData.append("iou", iou ?? 0.5);

    //Send to Flask model API
    const response = await axios.post(MODEL_API_URL, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 0,
    });

    const data = response.data;
    const now = new Date();

    if (!data || !Array.isArray(data.detections)) {
      return res
        .status(500)
        .json({ error: "Invalid response from model API." });
    }

    //Save detections
    const enhancedDetections = await Promise.all(
      data.detections.map(async (det) => {
        const { x1, y1, x2, y2 } = det.coordinates;
        const gpsCoords = det.gps_coordinates || null;

        const exists = await Detection.findOne({
          project_id: projectId,
          label: det.label,
          "bbox.x1": x1,
          "bbox.y1": y1,
          "bbox.x2": x2,
          "bbox.y2": y2,
        });

        if (exists) return { ...det, duplicate: true };

        const newDetection = new Detection({
          project_id: projectId,
          label: det.label,
          bbox: { x1, y1, x2, y2 },
          gps_coordinates: gpsCoords,
          confidence: det.confidence,
          date: now,
        });

        await newDetection.save();
        return { ...det, duplicate: false };
      })
    );

    //Update summary
    const allDetections = await Detection.find({ project_id: projectId });
    const counts = {};
    allDetections.forEach((d) => {
      counts[d.label] = (counts[d.label] || 0) + 1;
    });

    const summaryData = {
      project_id: projectId,
      land_covers: [{ name: "Not Specified", counts }],
      filters: [modelKey],
      recorded_at: now,
    };

    await Summary.findOneAndUpdate({ project_id: projectId }, summaryData, {
      new: true,
      upsert: true,
    });

    res.json({
      project_id: projectId,
      date: now,
      detections: enhancedDetections,
      result_image: data.result_image,
      summary: summaryData,
      metadata: data.metadata,
    });
  } catch (err) {
    console.error("Error in analyzeImage:", err.message || err);
    res.status(500).json({ error: "Error processing image." });
  }
  // Files will be cleaned up by the cleanup job after 30 minutes
};
