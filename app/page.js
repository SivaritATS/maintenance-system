"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMaintenance } from "./context/MaintenanceContext";
import Swal from "sweetalert2";
import axios from "axios";
import { encrypt } from "@/encrypt";
import { decrypt } from "@/encrypt";
export default function LoginPage() {
  const { login, currentUser } = useMaintenance();
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    //   if (currentUser) {
    //     if (currentUser.role === 'admin') router.push('/admin');
    //     else if (currentUser.role === 'tech') router.push('/technician');
    //     else router.push('/user');
    //   }
    // }, [currentUser, router]);
    // if (currentUser) {
    //   if (currentUser.role === 'admin') router.push('/admin');
    //   else if (currentUser.role === 'tech') router.push('/technician');
    //   else router.push('/user');
    // }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // First, try to log in as an Operator (Admin or Technician)
      const operatorRes = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/api/getoperator/byusername`,
        { username: loginId }
      );

      if (operatorRes.status === 200 && operatorRes.data && operatorRes.data.length > 0) {
        const data = operatorRes.data[0];
        if (data.passwords === loginPwd) {
          Swal.fire({
            icon: "success",
            title: "Welcome back!",
            text: `Logged in as ${data.fnames}`,
            timer: 1500,
            showConfirmButton: false,
          });
          const encryptedId = encodeURIComponent(encrypt(data.operator_id.toString()));
          if (data.roles === "technician") {
            router.push(`/technician?id=${encryptedId}`);
          } else if (data.roles === "admin") {
            router.push(`/admin?id=${encryptedId}`);
          }
          return;
        }
      }

      // If not found in operators or password mismatch, try Student (User)
      const studentRes = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/api/getstudent/byname`,
        { fname: loginId }
      );

      if (studentRes.status === 200 && studentRes.data && studentRes.data.length > 0) {
        const data = studentRes.data[0];
        if (data.passwords === loginPwd) {
          Swal.fire({
            icon: "success",
            title: "Welcome back!",
            text: `Logged in as ${data.fnames}`,
            timer: 1500,
            showConfirmButton: false,
          });
          const encryptedId = encodeURIComponent(encrypt(data.student_id.toString()));
          router.push(`/user?id=${encryptedId}`);
          return;
        }
      }

      // If neither worked
      setError("Invalid ID or Password");
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Invalid ID or Password. Please try again.",
      });

    } catch (error) {
      setError("An error occurred during login. Please try again.");
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "An error occurred during login. Please try again.",
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-card animate-in">
          <div className="login-logo">UF</div>
          <h1 className="login-title">UniFix</h1>
          <p className="login-subtitle">University Maintenance Portal</p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">User ID</label>
              <input
                className="form-input"
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter your ID"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={loginPwd}
                onChange={(e) => setLoginPwd(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ padding: "0.75rem" }}
            >
              Sign In
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
