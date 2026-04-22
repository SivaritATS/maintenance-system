"use client";

import { useState, useEffect } from "react";
import { useMaintenance } from "../context/MaintenanceContext";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import { CATEGORIES } from "../mockData";
import axios from "axios";
import { get } from "http";
import { decrypt } from "@/encrypt";
import Swal from "sweetalert2";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <UserPage />
    </Suspense>
  );
}

function UserPage() {
  const { currentUser, tickets, createTicket, setCurrentUser } = useMaintenance();
  const router = useRouter();

  const [decryptuser, setDecryptUser] = useState(null);
  const [name, setName] = useState("");
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "General",
    location: "",
  });

  const [activeStatus, setActiveStatus] = useState("all");
  const [data, setData] = useState([]);

  const searchParams = useSearchParams();

  useEffect(() => {
    const encryptedId = searchParams.get("id") || localStorage.getItem("eid");
    if (!encryptedId) {
      router.push("/");
      return;
    }
    if (searchParams.get("id") && searchParams.get("id") !== localStorage.getItem("eid")) {
      localStorage.setItem("eid", searchParams.get("id"));
    }
    const loginId = decrypt(decodeURIComponent(encryptedId));
    setDecryptUser(loginId);
  }, [searchParams]);

  useEffect(() => {
    if (!decryptuser) return;
    const validateuser = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/getstudent/byid`,
          {
            id: decryptuser,
          },
        );
        if (response.status === 200 && response.data && response.data.length > 0) {
          const data = response.data[0];
          setName(data.fnames);
          setCurrentUser({
            id: data.student_id,
            name: `${data.fnames} ${data.lnames}`,
            role: "user"
          });
          return;
        } else {
          Swal.fire({
            icon: "error",
            title: "Invalid User",
            text: "The user ID is invalid. Please log in again.",
          }).then(() => {
            router.push("/");
          });
          return;
        }
      } catch (error) {
        console.error("Validation error:", error);
        Swal.fire({
          icon: "error",
          title: "Server Error",
          text: "An error occurred while validating the user.",
        }).then(() => {
          router.push("/");
        });
      }
    };
    const getdata = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/getfixs/studentreport`,
          {
            id: decryptuser,
          },
        );
        setData(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    validateuser();
    getdata();

    // Set up polling for real-time updates every 5 seconds
    const intervalId = setInterval(() => {
      getdata();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [decryptuser, router]);

  if (!decryptuser) return null;

  const myTickets = data;
  const pendingCount = data.filter(
    (t) => t.fix_status === "pending" || (t.fix_status === "approved" && !t.operator),
  ).length;
  const approvedCount = data.filter(
    (t) => t.fix_status === "approved" && t.operator,
  ).length;
  const completedCount = data.filter((t) => t.fix_status === "completed")
    .length;

  const filteredTickets = myTickets.filter((t) => {
    if (activeStatus === "all") return true;
    if (activeStatus === "pending") {
      return t.fix_status === "pending" || (t.fix_status === "approved" && !t.operator);
    }
    if (activeStatus === "in_progress") {
      return t.fix_status === "approved" && t.operator;
    }
    return t.fix_status === activeStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusLabel = (ticket) => {
    const status = ticket.fix_status;
    if (status === "approved" && !ticket.operator) {
      return "Pending";
    }
    switch (status) {
      case "approved":
      case "inprogress":
        return "In Progress";
      case "cancellation_requested":
        return "Cancellation Requested";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stringDate = new Date().toISOString().slice(0, 19).replace("T", " ");
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/addfixs`,
      {
        fixs_name: newTicket.title,
        fixs_detail: newTicket.description,
        fixs_location: newTicket.location,
        fixs_status: "pending",
        reporter: decryptuser,
        operator: null,
        report_date: stringDate,
        category: newTicket.category,
        finish_date: null,
        credit: null,
      },
    );
    if (response.status === 200) {
      createTicket(newTicket);
    } else {
      alert("Failed to submit report. Please try again.");
    }
  };

  const getCategoryClass = (cat) => {
    if (cat.includes("Public")) return "cat-Public";
    return `cat-${cat}`;
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 md:p-8 animate-in mt-6">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-base-content">หน้าแจ้งซ่อม</h1>
            <p className="text-base-content/60 mt-1">แจ้งปัญหาของคุณที่พบในมหาวิทยาลัย</p>
          </div>
          <div className="badge badge-primary badge-lg p-4 font-bold shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            {name}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div 
            className={`stat bg-base-100 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:-translate-y-1 ${activeStatus === "all" ? "border-primary" : "border-base-200"}`}
            onClick={() => setActiveStatus("all")}
          >
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div className="stat-title font-semibold text-base-content/60">Total Reports</div>
            <div className="stat-value text-primary">{data.length}</div>
          </div>
          
          <div 
            className={`stat bg-base-100 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:-translate-y-1 ${activeStatus === "pending" ? "border-warning" : "border-base-200"}`}
            onClick={() => setActiveStatus("pending")}
          >
            <div className="stat-figure text-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="stat-title font-semibold text-base-content/60">Pending</div>
            <div className="stat-value text-warning">{pendingCount}</div>
          </div>

          <div 
            className={`stat bg-base-100 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:-translate-y-1 ${activeStatus === "in_progress" ? "border-info" : "border-base-200"}`}
            onClick={() => setActiveStatus("in_progress")}
          >
            <div className="stat-figure text-info">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
            </div>
            <div className="stat-title font-semibold text-base-content/60">In Progress</div>
            <div className="stat-value text-info">{approvedCount}</div>
          </div>

          <div 
            className={`stat bg-base-100 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:-translate-y-1 ${activeStatus === "completed" ? "border-success" : "border-base-200"}`}
            onClick={() => setActiveStatus("completed")}
          >
            <div className="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="stat-title font-semibold text-base-content/60">Completed</div>
            <div className="stat-value text-success">{completedCount}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-xl border border-base-200 sticky top-24">
              <div className="card-body p-6">
                <h2 className="card-title text-xl mb-4 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary p-2 rounded-lg">📋</span>
                  New Report
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-control w-full">
                    <label className="label"><span className="label-text font-medium">เรื่องที่แจ้ง</span></label>
                    <input
                      className="input input-bordered w-full focus:input-primary"
                      value={newTicket.title}
                      onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                      placeholder="e.g. Broken Projector in Room 304"
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label"><span className="label-text font-medium">หมวดหมู่</span></label>
                    <select
                      className="select select-bordered w-full focus:select-primary"
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control w-full">
                    <label className="label"><span className="label-text font-medium">สถานที่</span></label>
                    <input
                      className="input input-bordered w-full focus:input-primary"
                      value={newTicket.location}
                      onChange={(e) => setNewTicket({ ...newTicket, location: e.target.value })}
                      placeholder="e.g. 11-101 Auditorium"
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label"><span className="label-text font-medium">รายละเอียด</span></label>
                    <textarea
                      className="textarea textarea-bordered h-24 focus:textarea-primary"
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      placeholder="Describe the problem in detail..."
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full mt-2 shadow-lg shadow-primary/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                    Submit Report
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex justify-between items-end mb-6 border-b border-base-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-base-content">My Reports</h2>
                <div className="text-sm text-base-content/60 mt-1">Showing {filteredTickets.length} reports</div>
              </div>
            </div>

            {data.length === 0 ? (
              <div className="card bg-base-100 shadow-sm border border-base-200 py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4 opacity-50">📭</div>
                  <h3 className="text-xl font-bold mb-2 text-base-content">No reports found</h3>
                  <p className="text-base-content/60 max-w-sm">You haven't submitted any maintenance requests yet. Fill out the form to create one.</p>
                </div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="card bg-base-100 shadow-sm border border-base-200 py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4 opacity-50">🔍</div>
                  <h3 className="text-xl font-bold mb-2 text-base-content">No matching reports</h3>
                  <p className="text-base-content/60 max-w-sm">Try changing the filter to see other reports.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTickets.map((ticket) => {
                  const statusLabel = getStatusLabel(ticket);
                  let statusColor = "badge-neutral";
                  if (statusLabel === "Pending") statusColor = "badge-warning";
                  if (statusLabel === "In Progress") statusColor = "badge-info";
                  if (statusLabel === "Completed") statusColor = "badge-success";
                  if (statusLabel === "Cancellation Requested") statusColor = "badge-error";

                  return (
                    <div key={ticket.fix_id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
                      <div className="card-body p-5">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Ticket #{ticket.fix_id}</div>
                          <div className={`badge ${statusColor} font-semibold gap-1 py-3 px-3 shadow-sm`}>
                            {statusLabel}
                          </div>
                        </div>

                        <h3 className="card-title text-lg font-bold mt-1 mb-3 text-base-content line-clamp-1">{ticket.fix_name}</h3>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="badge badge-outline text-xs">{ticket.category}</span>
                          {ticket.fix_location && (
                            <span className="text-xs text-base-content/60 flex items-center">
                              📍 {ticket.fix_location}
                            </span>
                          )}
                          <span className="text-xs text-base-content/60 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {formatDate(ticket.report_date)}
                          </span>
                        </div>

                        <div className="bg-base-200/50 p-3 rounded-lg text-sm text-base-content/80 line-clamp-2 min-h-[3.5rem]">
                          {ticket.fix_detail}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
