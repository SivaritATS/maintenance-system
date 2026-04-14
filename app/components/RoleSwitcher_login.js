"use client";
import { useMaintenance } from "../context/MaintenanceContext";
import { useRouter } from "next/navigation";

export default function RoleSwitcher() {
  const { switchUser, DEBUG_MODE, currentUser } = useMaintenance();
  const router = useRouter();

  if (!DEBUG_MODE) return null;

  const handleSwitch = (role) => {
    switchUser(role);
    if (role === "user") {
      localStorage.setItem("role", "user");
    } else if (role === "admin") {
      localStorage.setItem("role", "admin");
    } else if (role === "tech") {
      localStorage.setItem("role", "tech");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.25rem",
        right: "1.25rem",
        background: "rgba(17, 24, 39, 0.9)",
        backdropFilter: "blur(12px)",
        padding: "0.6rem 0.8rem",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        zIndex: 9999,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <span
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.7rem",
          marginRight: "0.3rem",
          fontWeight: 500,
        }}
      >
        Login as
      </span>
      <button
        onClick={() => handleSwitch("user")}
        style={{
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          color: "white",
          border: "none",
          padding: "0.35rem 0.75rem",
          borderRadius: "8px",
          fontSize: "0.75rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "transform 150ms",
        }}
      >
        👤 User
      </button>
      <button
        onClick={() => handleSwitch("admin")}
        style={{
          background: "linear-gradient(135deg, #ec4899, #f472b6)",
          color: "white",
          border: "none",
          padding: "0.35rem 0.75rem",
          borderRadius: "8px",
          fontSize: "0.75rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "transform 150ms",
        }}
      >
        🛡 Admin
      </button>
      <button
        onClick={() => handleSwitch("tech")}
        style={{
          background: "linear-gradient(135deg, #10b981, #34d399)",
          color: "white",
          border: "none",
          padding: "0.35rem 0.75rem",
          borderRadius: "8px",
          fontSize: "0.75rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "transform 150ms",
        }}
      >
        🔧 Tech
      </button>
    </div>
  );
}
