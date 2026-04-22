"use client";
import { useState, useEffect, Suspense } from "react";
import { useMaintenance } from "../../context/MaintenanceContext";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import Swal from "sweetalert2";
import { decrypt } from "@/encrypt";
import axios from "axios";

function DashboardContent() {
  const { setCurrentUser } = useMaintenance();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [decryptuser, setDecryptUser] = useState(null);
  const [techStats, setTechStats] = useState([]);

  useEffect(() => {
    const encryptedId = searchParams.get("id") || localStorage.getItem("eid");
    if (!encryptedId) {
      router.push("/");
      return;
    }
    const loginId = decrypt(decodeURIComponent(encryptedId));
    setDecryptUser(loginId);
  }, [searchParams]);

  useEffect(() => {
    if (!decryptuser) return;
    const validateUser = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/getoperator`,
          { id: decryptuser },
        );
        if (response.status === 200 && response.data && response.data.length > 0) {
          const data = response.data[0];
          setCurrentUser({
            id: data.operator_id,
            name: `${data.fnames} ${data.lnames}`,
            role: "admin",
            score: data.credit,
          });
        }
      } catch (error) {
        console.log(error);
      }
    };
    const getTechStats = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_URL}/api/admin/techstats`,
        );
        if (response.status === 200) {
          setTechStats(response.data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    validateUser();
    getTechStats();

    const intervalId = setInterval(() => {
      getTechStats();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [decryptuser]);

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 md:p-8 animate-in mt-6">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-base-content">Technician Performance</h1>
            <p className="text-base-content/60 mt-1">Status and performance metrics for all technicians</p>
          </div>
          <div className="badge badge-primary badge-lg p-4 font-bold shadow-sm">
             Status tecnic
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200 text-base-content/80 border-b-2 border-base-300">
                  <th className="font-bold text-sm py-4">Technician</th>
                  <th className="font-bold text-sm py-4">Score</th>
                  <th className="font-bold text-sm py-4">Total Jobs</th>
                  <th className="font-bold text-sm py-4 text-success">Completed</th>
                  <th className="font-bold text-sm py-4 text-error">Failed</th>
                  <th className="font-bold text-sm py-4 text-info">Active</th>
                  <th className="font-bold text-sm py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {techStats.map(tech => (
                  <tr key={tech.id} className="hover:bg-base-200/50 transition-colors border-b border-base-200">
                    <td className="font-semibold py-4">{tech.name}</td>
                    <td className={`font-bold py-4 text-lg ${tech.score < 30 ? "text-error" : ""}`}>
                      {tech.score}
                    </td>
                    <td className="py-4">{tech.totalTaken}</td>
                    <td className="py-4 text-success font-semibold">{tech.completed}</td>
                    <td className="py-4 text-error font-semibold">{tech.failed}</td>
                    <td className="py-4 text-info font-semibold">{tech.active}</td>
                    <td className="py-4">
                      <div className={`badge ${tech.score < 30 ? 'badge-error' : 'badge-success'} font-semibold p-3`}>
                        {tech.score < 30 ? 'Suspended' : 'Active'}
                      </div>
                    </td>
                  </tr>
                ))}
                {techStats.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-base-content/50">
                      No technician data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-8">
            <button 
                onClick={() => router.push(`/admin?id=${searchParams.get('id')}`)}
                className="btn btn-outline gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Admin Page
            </button>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
