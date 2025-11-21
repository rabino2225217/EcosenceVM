const express = require('express');
const router = express.Router();
const analysisController = require('../../controllers/client/analysisController');
const multer = require("multer");
const path = require("path");
const fs = require("fs");

//Uploads directory
const uploadDir = path.join(__dirname, "../../uploads/temp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
}
// Ensure directory is writable
try {
  fs.accessSync(uploadDir, fs.constants.W_OK);
} catch (err) {
  console.error("Uploads directory is not writable:", err);
}

//Disk-based storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists and is writable
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// POST /classify/analyze
router.post("/analyze", upload.single("file"), analysisController.analyzeImage);

module.exports = router;