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
  const hasChecked = React.useRef(false);

  React.useEffect(() => {
    // Only check once per mount
    if (hasChecked.current) {
      return;
    }

    hasChecked.current = true;
    let active = true;

    const verifyAuth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (active) {
            setChecked(true);
            setAuthorized(false);
            navigate("/login", { 
              replace: true,
              state: { shouldCheck: false } // Prevent login page from checking session again
            });
          }
          return;
        }

        const user = await res.json();

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
            // Don't fail auth if socket fails, just log it
          }
        }

        if (active) {
          setAuthorized(true);
          setChecked(true);
        }
      } catch (err) {
        console.error("Auth verification error:", err);
        if (active) {
          setChecked(true);
          setAuthorized(false);
          navigate("/login", { 
            replace: true,
            state: { shouldCheck: false } // Prevent login page from checking session again
          });
        }
      }
    };

    verifyAuth();

    return () => {
      active = false;
    };
  }, []); // Empty dependency array - only run once on mount

  if (!checked) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 space-x-2">
        <span className="text-sm font-medium">Loading EcoSense</span>
        <Loader className="h-5 w-5 animate-spin text-[#6FA672]" />
      </div>
    );
  }

  if (!authorized) {
    return null; // Will redirect via navigate
  }

  return <>{children}</>;
}