import socket from "../services/socket";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader } from "lucide-react";

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireStaff = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean;
}) {
  const navigate = useNavigate();
  const [checked, setChecked] = React.useState(false);
  const [authorized, setAuthorized] = React.useState(false);
  const hasRun = React.useRef(false);

  React.useEffect(() => {
    // Only run once per component mount
    if (hasRun.current) {
      return;
    }
    hasRun.current = true;

    let active = true;

    const verifyAuth = async () => {
      if (!active) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          credentials: "include",
        });

        if (!active) return;

        if (!res.ok) {
          if (active) {
            setChecked(true);
            setAuthorized(false);
            navigate("/login", { replace: true });
          }
          return;
        }

        const user = await res.json();

        if (!active) return;

        if (requireAdmin && user.role !== "Admin") {
          if (active) {
            setChecked(true);
            setAuthorized(false);
            navigate("/unauthorized", { replace: true });
          }
          return;
        }

        if (requireStaff && !["DENR staff", "Admin"].includes(user.role)) {
          if (active) {
            setChecked(true);
            setAuthorized(false);
            navigate("/unauthorized", { replace: true });
          }
          return;
        }

        if (active && !socket.connected) {
          try {
            socket.connect();
          } catch (socketErr) {
            console.error("Socket connection error:", socketErr);
          }
        }

        if (active) {
          setAuthorized(true);
          setChecked(true);
        }
      } catch (err) {
        if (active) {
          setChecked(true);
          setAuthorized(false);
          navigate("/login", { replace: true });
        }
      }
    };

    verifyAuth();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - only run once on mount

  if (!checked) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 space-x-2">
        <span className="text-sm font-medium">Loading EcoSense</span>
        <Loader className="h-5 w-5 animate-spin text-[#6FA672]" />
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}