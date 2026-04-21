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
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center font-bold text-white text-3xl shadow-lg mb-4">
              UF
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">UniFix</h1>
            <p className="text-sm text-base-content/60 font-medium tracking-wide uppercase mt-1">Maintenance Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">User ID</span>
              </label>
              <input
                className="input input-bordered w-full focus:input-primary"
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter your ID"
                required
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Password</span>
              </label>
              <input
                className="input input-bordered w-full focus:input-primary"
                type="password"
                value={loginPwd}
                onChange={(e) => setLoginPwd(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="alert alert-error text-sm p-3 rounded-lg shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full shadow-lg shadow-primary/30 mt-4"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
