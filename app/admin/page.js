"use client";
import { useState, useEffect, Suspense } from "react";
import { useMaintenance } from "../context/MaintenanceContext";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { decrypt } from "@/encrypt";
import axios from "axios";

const MySwal = withReactContent(Swal);

function AdminContent() {
  const {
    currentUser,
    tickets,
    updateTicketStatus,
    updateUserScore,
    users,
    setCurrentUser,
  } = useMaintenance();
  const router = useRouter();
  const [operatorinfo, setOperatorInfo] = useState([]);
  const [activeStatus, setActiveStatus] = useState("actionable");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [decryptuser, setDecryptUser] = useState(null);
  const [fixdata, setFixData] = useState([]);
  const [jobcancle, setJobcancle] = useState([]);
  const [techStats, setTechStats] = useState([]);
  const [scoreMap, setScoreMap] = useState({});

  useEffect(() => {
    const encryptedId = searchParams.get("id") || localStorage.getItem("eid");
    if (!encryptedId) {
      router.push("/");
      return;
    }
    // Keep localStorage in sync
    if (searchParams.get("id") && searchParams.get("id") !== localStorage.getItem("eid")) {
      localStorage.setItem("eid", searchParams.get("id"));
    }
    const loginId = decrypt(decodeURIComponent(encryptedId));
    setDecryptUser(loginId);
    // Read tab from URL, fallback to actionable if no tab param exists
    setActiveStatus(tabParam || "actionable");
  }, [searchParams]);

  useEffect(() => {
    if (!decryptuser) return;
    const validateUser = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/getoperator`,
          {
            id: decryptuser,
          },
        );
        if (
          response.status === 200 &&
          response.data &&
          response.data.length > 0
        ) {
          const data = response.data[0];
          setOperatorInfo(data);
          setCurrentUser({
            id: data.operator_id,
            name: `${data.fnames} ${data.lnames}`,
            role: "admin",
            score: data.credit,
          });
        } else {
          throw new Error("Invalid User");
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Unauthorized",
          text: "Unauthorized to access this page.",
        });
        router.push("/");
        console.log(error);
      }
    };
    const getinformation = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_URL}/api/getfixs/fixsall`,
        );
        if (response.status === 200) {
          const data = response.data;
          setFixData(data);
        }
        const response1 = await axios.get(
          `${process.env.NEXT_PUBLIC_URL}/api/getjobcancle`,
        );
        if (response1.status === 200) {
          const data = response1.data;
          setJobcancle(data);
        }
        const response2 = await axios.get(
          `${process.env.NEXT_PUBLIC_URL}/api/admin/techstats`,
        );
        if (response2.status === 200) {
          setTechStats(response2.data);
        }
      } catch (error) {
        console.log(error);
        // Suppress Swal error here so it doesn't spam the user during polling
      }
    };

    validateUser();
    getinformation();

    // Set up polling for real-time updates every 5 seconds
    const intervalId = setInterval(() => {
      getinformation();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [decryptuser]);

  useEffect(() => {
    const fetchScores = async () => {
      const map = {};
      for (const ticket of jobcancle) {
        if (ticket.operator && !map[ticket.operator]) {
          const score = await getscore(ticket.operator);
          map[ticket.operator] = score;
        }
      }
      setScoreMap(map);
    };
    if (jobcancle.length > 0) {
      fetchScores();
    }
  }, [jobcancle]);

  const pendingTickets = fixdata.filter((t) => t.fix_status === "pending");
  const cancellationRequests = jobcancle.filter((t) => t.status === "pending");
  // console.log(cancellationRequests);
  const allApproved = fixdata.filter(
    (t) => t.fix_status === "approved" || t.fix_status === "inprogress",
  );
  const allCompleted = fixdata.filter((t) => t.fix_status === "completed");

  const getscore = async (id) => {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/getoperator`,
      { id },
    );

    if (response.status === 200 && response.data.length > 0) {
      const data = response.data[0];
      return data.score ?? 0;
    }

    return 0;
  };

  const handlingcancleapprove = async (ticket) => {
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_URL}/api/updatestatus/`,
        {
          id: ticket.fix_no,
          status: "pending",
          finish_date: null,
          operator: null,
        },
      );
      if (response.status === 200) {
        const response1 = await axios.put(
          `${process.env.NEXT_PUBLIC_URL}/api/updatejobcancle/`,
          {
            id: ticket.fix_no,
            status: "approved",
          },
        );
        if (response1.status === 200) {
          Swal.fire({
            icon: "success",
            title: `Approved cancellation for ${ticket.operator_name ?? "Technician"}`,
            text: `Ticket #${ticket.fix_no} has been approved for cancellation.`,
          });
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Something went wrong ",
        text: "Please Try Again.",
      });
    }
  };
  const handlingcanclerejected = async (ticket) => {
    // console.log(ticket.operator);
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_URL}/api/updatestatus/`,
        {
          id: ticket.fix_no,
          status: "approved",
          finish_date: null,
          operator: null,
        },
      );
      if (response.status === 200) {
        const response1 = await axios.put(
          `${process.env.NEXT_PUBLIC_URL}/api/updatejobcancle/`,
          {
            id: ticket.fix_no,
            status: "rejected",
          },
        );
        if (response1.status === 200) {
          const response2 = await axios.post(
            `${process.env.NEXT_PUBLIC_URL}/api/getoperator`,
            {
              id: ticket.operator,
            },
          );
          const datascore = response2.data[0];
          const techscore = Number(datascore.score);

          const deductscore = techscore - 5;
          console.log(deductscore);
          if (response2.status === 200) {
            const response3 = await axios.put(
              `${process.env.NEXT_PUBLIC_URL}/api/addscore/`,
              {
                id: ticket.operator,
                score: deductscore,
              },
            );
            if (response3.status === 200) {
              Swal.fire({
                icon: "success",
                title: `Rejected cancellation for ${ticket.operator_name ?? "Technician"}`,
                text: `Ticket #${ticket.fix_no} has been rejected ( -5 score)`,
              });
            }
          }
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Something went wrong ",
        text: "Please Try Again.",
      });
    }
  };

  const handlingrequestreject = async (ticket) => {
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_URL}/api/updatestatus/updatebyid`,
        {
          status: "rejected",
          id: ticket.fix_id,
        },
      );
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: `ticket rejected `,
          text: `ticket has been rejected`,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Something went wrong ",
        text: "Please Try Again.",
      });
    }
  };
  const handlingrequestapprove = async (ticket) => {
    try {
      const adminName = `${operatorinfo.fnames} ${operatorinfo.lnames}`;
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_URL}/api/updatestatus/updatebyid`,
        {
          status: "approved",
          id: ticket.fix_id,
          approved_by: adminName,
        },
      );
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: `ticket approved by ${adminName}`,
          text: `ticket has been approved`,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Something went wrong ",
        text: "Please Try Again.",
      });
    }
  };

  const getFilteredTickets = () => {
    switch (activeStatus) {
      case "approved":
        return allApproved;
      case "completed":
        return allCompleted;
      default:
        return [];
    }
  };

  const filteredList = getFilteredTickets();

  const handleCancellation = (ticket, isApproved) => {
    const techUser = users.find((u) => u.id === ticket.operator);
    const techName = techUser ? techUser.name : ticket.operator;

    const handleallowcancle = async (ticket) => {
      MySwal.fire(
        "Allowed",
        `Cancellation approved for ${techName}. No penalty applied.`,
        "success",
      );
    };
  };

  const getCategoryClass = (cat) => {
    if (cat.includes("Public")) return "cat-Public";
    return `cat-${cat}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 md:p-8 animate-in mt-6">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-base-content">Admin Dashboard</h1>
            <p className="text-base-content/60 mt-1">Review pending requests and manage technicians</p>
          </div>
          <div className="badge badge-primary badge-lg p-4 font-bold shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Administrator
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div 
            className={`stat bg-base-100 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:-translate-y-1 ${activeStatus === "actionable" ? "border-warning" : "border-base-200"}`}
            onClick={() => setActiveStatus("actionable")}
          >
            <div className="stat-figure text-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="stat-title font-semibold text-base-content/60">Pending Review</div>
            <div className="stat-value text-warning">{pendingTickets.length}</div>
          </div>

          <div 
            className={`stat bg-base-100 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:-translate-y-1 ${activeStatus === "actionable" ? "border-error" : "border-base-200"}`}
            onClick={() => setActiveStatus("actionable")}
          >
            <div className="stat-figure text-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
            <div className="stat-title font-semibold text-base-content/60">Cancel Requests</div>
            <div className="stat-value text-error">{cancellationRequests.length}</div>
          </div>

          <div 
            className={`stat bg-base-100 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:-translate-y-1 ${activeStatus === "approved" ? "border-info" : "border-base-200"}`}
            onClick={() => setActiveStatus("approved")}
          >
            <div className="stat-figure text-info">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
            </div>
            <div className="stat-title font-semibold text-base-content/60">In Progress</div>
            <div className="stat-value text-info">{allApproved.length}</div>
          </div>

          <div 
            className={`stat bg-base-100 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:-translate-y-1 ${activeStatus === "completed" ? "border-success" : "border-base-200"}`}
            onClick={() => setActiveStatus("completed")}
          >
            <div className="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="stat-title font-semibold text-base-content/60">Completed</div>
            <div className="stat-value text-success">{allCompleted.length}</div>
          </div>

        </div>

        {activeStatus === "actionable" ? (
          <div className="animate-in fade-in">
            {/* Pending Section */}
            <div className="flex justify-between items-end mb-6 border-b border-base-200 pb-4">
              <h2 className="text-2xl font-bold text-base-content">Pending Review</h2>
              <span className="text-sm text-base-content/60">{pendingTickets.length} items</span>
            </div>

            {pendingTickets.length === 0 && cancellationRequests.length === 0 ? (
              <div className="card bg-base-100 shadow-sm border border-base-200 py-16 mb-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4 opacity-50">🎉</div>
                  <h3 className="text-xl font-bold mb-2 text-base-content">All Clear!</h3>
                  <p className="text-base-content/60 max-w-sm">No pending reports or cancellations to review.</p>
                </div>
              </div>
            ) : (
              <>
                {pendingTickets.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {pendingTickets.map((ticket) => (
                      <div key={ticket.fix_id} className="card bg-base-100 shadow-sm border-t-4 border-t-warning border-x border-b border-base-200 hover:shadow-md transition-shadow">
                        <div className="card-body p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div className="text-xs font-bold text-base-content/50 uppercase tracking-wider">
                              #{ticket.fix_id} • {ticket.reporter_name ?? ticket.reporter}
                            </div>
                            <div className="badge badge-warning font-semibold gap-1 py-3 px-3 shadow-sm">Pending</div>
                          </div>
                          
                          <h3 className="card-title text-lg font-bold mt-1 mb-3 text-base-content line-clamp-1">{ticket.fix_name}</h3>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="badge badge-outline text-xs">{ticket.category}</span>
                            {ticket.fixs_location && (
                              <span className="text-xs text-base-content/60 flex items-center">
                                📍 {ticket.fixs_location}
                              </span>
                            )}
                            <span className="text-xs text-base-content/60 flex items-center">
                              📅 {formatDate(ticket.report_date)}
                            </span>
                          </div>
                          
                          <div className="bg-base-200/50 p-3 rounded-lg text-sm text-base-content/80 line-clamp-2 min-h-[3.5rem] mb-4">
                            {ticket.fix_detail}
                          </div>
                          
                          <div className="flex gap-2 mt-auto">
                            <button onClick={() => handlingrequestapprove(ticket)} className="btn btn-primary flex-1">
                              ✓ Approve
                            </button>
                            <button onClick={() => handlingrequestreject(ticket)} className="btn btn-error btn-outline flex-1">
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Cancellation Requests */}
            {cancellationRequests.length > 0 && (
              <>
                <div className="divider mb-6"></div>
                <div className="flex justify-between items-end mb-6 border-b border-base-200 pb-4">
                  <h2 className="text-2xl font-bold text-error">⚠️ Cancellation Requests</h2>
                  <span className="text-sm text-base-content/60">{cancellationRequests.length} requests</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cancellationRequests.map((ticket) => {
                    const techName = ticket.operator_name ?? "Unassigned";
                    const techScore = scoreMap[ticket.operator] ?? "?";

                    return (
                      <div key={ticket.fix_no} className="card bg-base-100 shadow-md border-t-4 border-t-error border-x border-b border-base-200">
                        <div className="card-body p-5">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-xs font-bold text-base-content/50 uppercase tracking-wider">#{ticket.fix_no}</div>
                            <div className="badge badge-error font-semibold gap-1 py-3 px-3 shadow-sm text-white">Cancel Request</div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-4 mt-2">
                            <span className="badge badge-outline text-xs">🔧 {techName}</span>
                            <span className="badge badge-outline text-xs badge-neutral">Score: {techScore}</span>
                          </div>

                          <div className="bg-error/10 border border-error/20 p-4 rounded-lg mb-4">
                            <div className="text-xs font-bold text-error/80 uppercase tracking-wider mb-1">Reason</div>
                            <div className="text-sm font-medium text-base-content/80">
                              {ticket.detail}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-auto">
                            <button onClick={() => handlingcancleapprove(ticket)} className="btn btn-neutral flex-1">
                              Allow
                            </button>
                            <button onClick={() => handlingcanclerejected(ticket)} className="btn btn-error text-white flex-1">
                              Reject (-5)
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : activeStatus === "performance" ? (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-end mb-6 border-b border-base-200 pb-4">
              <h2 className="text-2xl font-bold text-base-content">Technician Performance Dashboard</h2>
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
          </div>
        ) : (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-end mb-6 border-b border-base-200 pb-4">
              <h2 className="text-2xl font-bold text-base-content">
                {activeStatus === "approved" ? "In Progress" : "Completed Jobs"}
              </h2>
              <span className="text-sm text-base-content/60">{filteredList.length} items</span>
            </div>
            
            {filteredList.length === 0 ? (
              <div className="card bg-base-100 shadow-sm border border-base-200 py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4 opacity-50">📭</div>
                  <h3 className="text-xl font-bold mb-2 text-base-content">No tickets found</h3>
                  <p className="text-base-content/60 max-w-sm">No tickets in this status.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredList.map((ticket) => {
                  let statusColor = "badge-neutral";
                  const statusRaw = ticket.fix_status === "approved" || ticket.fix_status === "inprogress" ? "In Progress" : ticket.fix_status;
                  
                  if (statusRaw === "Pending") statusColor = "badge-warning";
                  if (statusRaw === "In Progress") statusColor = "badge-info";
                  if (statusRaw === "Completed" || statusRaw === "completed") statusColor = "badge-success";
                  
                  return (
                    <div key={ticket.fix_id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
                      <div className="card-body p-5">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-xs font-bold text-base-content/50 uppercase tracking-wider">#{ticket.fix_id}</div>
                          <div className={`badge ${statusColor} font-semibold gap-1 py-3 px-3 shadow-sm`}>
                            {statusRaw}
                          </div>
                        </div>
                        
                        {ticket.approved_by && (
                          <div className="text-xs text-primary font-semibold mb-2">
                            Approved by: {ticket.approved_by}
                          </div>
                        )}

                        <h3 className="card-title text-lg font-bold mt-1 mb-3 text-base-content line-clamp-1">{ticket.fix_name}</h3>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="badge badge-outline text-xs">{ticket.category}</span>
                          {ticket.fixs_location && (
                            <span className="text-xs text-base-content/60 flex items-center">
                              📍 {ticket.fixs_location}
                            </span>
                          )}
                          <span className="text-xs text-base-content/60 flex items-center">
                            🔧 {ticket.operator_name ?? "Unassigned"}
                          </span>
                          <span className="text-xs text-base-content/60 flex items-center">
                            📅 {formatDate(ticket.report_date)}
                          </span>
                        </div>
                        
                        <div className="bg-base-200/50 p-3 rounded-lg text-sm text-base-content/80 line-clamp-3">
                          {ticket.fix_detail}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminContent />
    </Suspense>
  );
}
