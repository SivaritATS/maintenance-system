"use client";
import { useState, useEffect, Suspense } from "react";
import { useMaintenance } from "../context/MaintenanceContext";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Swal from "sweetalert2";
import { decrypt } from "@/encrypt";
import axios from "axios";

function TechnicianPage() {
  const {
    currentUser,
    tickets,
    updateTicketStatus,
    updateUserScore,
    setCurrentUser,
  } = useMaintenance();
  const router = useRouter();
  const [techTab, setTechTab] = useState("available");
  const [decryptuser, setDecryptUser] = useState(null);
  const searchParams = useSearchParams();
  const [fixdata, setFixData] = useState([]);
  const [operatorinfo, setOperatorInfo] = useState([]);
  const [scoredata, setScoredata] = useState([]);

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

    const getfixs = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_URL}/api/getfixs/fixsall`,
        );
        setFixData(response.data);
      } catch (error) {
        console.log(error);
      }
    };

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
            role: "tech",
            score: data.credit,
            category: data.category,
          });
          getfixs();
          getscore();
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
      }
    };
    const getscore = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/getscore`,
          {
            id: decryptuser,
          },
        );
        if (response.status === 200) {
          setScoredata(response.data);
        }
      } catch (error) {
        console.log(error);
        // Suppress Swal error here so it doesn't spam the user during polling
      }
    };

    validateUser();

    // Set up polling for real-time updates every 2 seconds
    const intervalId = setInterval(() => {
      getfixs();
      getscore();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [decryptuser]);

  const handletakejob = async (ticket) => {
    if ((operatorinfo?.score || 0) < 30) {
      Swal.fire({
        icon: "error",
        title: "Score Too Low",
        text: "Your score is below 30. You cannot accept new jobs this month.",
      });
      return;
    }
    
    try {
      const ticketid = ticket.fix_id;
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_URL}/api/updatestatus/updatesfixoperator`,
        {
          id: ticketid,
          status: "inprogress",
          operator: decryptuser,
        },
      );
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Job Taken",
          text: `You have taken Ticket #${ticket.fix_id}. Check "My Jobs" tab to view details.`,
          timer: 2000,
          showConfirmButton: false,
        });
        setTimeout(() => {
          router.refresh();
        }, 2000);
      }
    } catch (error) {
      console.log(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to take the job. Please try again.",
      });
    }
  };
  const calmyscore = operatorinfo.score ?? 0;
  // console.log(calmyscore);
  const availableTickets = fixdata.filter((t) => t.fix_status === "approved");
  const myJobs = fixdata.filter(
    (t) => t.operator === Number(decryptuser) && t.fix_status === "inprogress",
  );
  const myCompleted = fixdata.filter(
    (t) => t.operator === Number(decryptuser) && t.fix_status === "completed",
  );
  const myCancelRequests = fixdata.filter(
    (t) =>
      t.operator === Number(decryptuser) &&
      t.fix_status === "cancellation_requested",
  );

  const recommended = fixdata.filter(
    (t) =>
      (t.fix_status === "approved" && t.category === operatorinfo.category) ||
      (operatorinfo.category === "General" && t.fix_status === "approved"),
  );

  const others = fixdata.filter(
    (t) =>
      t.fix_status === "approved" &&
      t.category !== operatorinfo.category &&
      operatorinfo.category !== "General",
  );

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

  const handleCompleteJob = async (ticket) => {
    const { value: formValues } = await Swal.fire({
      title: "✅ Complete Job",
      html: `
        <div style="text-align: left; font-size: 0.9rem;">
          <div style="margin-bottom: 1.25rem; padding: 1rem; background: #f3f4f6; border-radius: 12px;">
            <p style="margin-bottom: 0.4rem; color: #6b7280; font-size: 0.8rem;">TECHNICIAN</p>
            <p style="margin-bottom: 0.25rem; font-weight: 600;">${operatorinfo.fnames + " " + operatorinfo.lnames}</p>
            <p style="margin: 0; color: #9ca3af; font-size: 0.85rem;">ID: ${decryptuser}</p>
          </div>
          <div>
            <label style="display:block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.85rem; color: #374151;">Upload Proof of Work</label>
            <input type="file" id="swal-input-image" accept="image/*" capture="environment" style="width: 100%; font-size: 14px; padding: 0.5rem; border: 1.5px dashed #d1d5db; border-radius: 8px; background: #f9fafb;" />
            <p style="margin-top: 0.5rem; font-size: 0.75rem; color: #9ca3af;">📸 Take a photo or upload an image of completed work</p>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Submit & Complete",
      confirmButtonColor: "#10b981",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const imageInput = document.getElementById("swal-input-image");
        if (!imageInput.files || imageInput.files.length === 0) {
          Swal.showValidationMessage(
            "Please upload a photo of the completed work",
          );
          return false;
        }
        return { image: imageInput.files[0] };
      },
    });

    if (formValues) {
      try {
        let credit = null;
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/getfixs/byid`,
          {
            id: ticket.fix_id,
          },
        );
        if (response.status === 200) {
          const data = response.data[0];
          credit = data.credit;
        }

        const response1 = await axios.put(
          `${process.env.NEXT_PUBLIC_URL}/api/updatestatus/updatebyid`,
          {
            id: ticket.fix_id,
            status: "completed",
          },
        );

        const stringDate = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        const response2 = await axios.put(
          `${process.env.NEXT_PUBLIC_URL}/api/updatefinishdate`,
          {
            id: ticket.fix_id,
            date: stringDate,
          },
        );

        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(formValues.image);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });

        const response3 = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/addpicture`,
          {
            id: ticket.fix_id,
            image: base64,
          },
        );
        const response4 = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/addtrans`,
          { operator_id: decryptuser, credit_received: credit },
        );

        const currentScore = Number(operatorinfo.score ?? 0);
        const newScore = currentScore + 5;

        const response5 = await axios.put(
          `${process.env.NEXT_PUBLIC_URL}/api/addscore`,
          {
            id: decryptuser,
            score: newScore,
          },
        );

        if (
          response1.status === 200 &&
          response2.status === 200 &&
          response3.status === 200 &&
          response4.status === 200 &&
          response5.status === 200
        ) {
          Swal.fire({
            icon: "success",
            title: `Job Completed! ${credit} coins add to your account 🎉`,
            text: "Upload และบันทึกสำเร็จ",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleCancelJob = async (ticket) => {
    const { value: reason } = await Swal.fire({
      title: "⚠️ Request Cancellation",
      input: "textarea",
      inputLabel: "Reason for cancellation",
      inputPlaceholder: "Why are you cancelling this job?",
      inputAttributes: { "aria-label": "Type your reason here" },
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Submit Request",
      cancelButtonText: "Go Back",
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: (value) => {
        if (!value || value.trim() === "") {
          Swal.showValidationMessage("Please provide a reason for cancellation");
          return false;
        }
        return value;
      },
    });

    if (reason) {
      try {
        Swal.fire({
          title: "Sending Request...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // 1. Add to job cancellation table
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/jobcancle`,
          {
            id: Number(ticket.fix_id),
            detail: reason,
            operator: decryptuser,
            status: "pending",
          },
        );

        // 2. Update status in fixs table to prevent duplicate requests
        const responseStatus = await axios.put(
          `${process.env.NEXT_PUBLIC_URL}/api/updatestatus/updatebyid`,
          {
            id: ticket.fix_id,
            status: "cancellation_requested",
          },
        );

        if (response.status === 200 && responseStatus.status === 200) {
          Swal.fire({
            icon: "info",
            title: "Request Sent",
            text: "Cancellation request sent to admin for review.",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        console.log(error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to send cancellation request. Please try again.",
        });
      }
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-base-200 pt-20">
      <div className="container mx-auto p-4 md:p-8 animate-in">
        {/* Page Hero */}
        <div className="page-hero flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-base-content">Technician Dashboard</h1>
            <p className="text-base-content/60 mt-1">Find new tasks and manage your active jobs</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="badge badge-primary badge-lg p-4 font-bold shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Technician
            </div>
            {operatorinfo.category && (
              <div className="badge badge-outline badge-md font-semibold px-3 py-3 border-primary/30 text-primary">
                Specialty: {operatorinfo.category}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="content-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div 
            className={`stat bg-base-100 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:-translate-y-1 ${techTab === "available" ? "active-info" : "border-base-200"}`}
            onClick={() => setTechTab("available")}
          >
            <div className="stat-figure text-info">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div className="stat-title font-semibold text-base-content/60">Available</div>
            <div className="stat-value text-info">{availableTickets.length}</div>
          </div>

          <div 
            className={`stat bg-base-100 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:-translate-y-1 ${techTab === "my-jobs" ? "active-primary" : "border-base-200"}`}
            onClick={() => setTechTab("my-jobs")}
          >
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
            </div>
            <div className="stat-title font-semibold text-base-content/60">Active Jobs</div>
            <div className="stat-value text-primary">{myJobs.length}</div>
          </div>

          <div 
            className={`stat bg-base-100 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:-translate-y-1 ${techTab === "completed" ? "active-success" : "border-base-200"}`}
            onClick={() => setTechTab("completed")}
          >
            <div className="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="stat-title font-semibold text-base-content/60">Completed</div>
            <div className="stat-value text-success">{myCompleted.length}</div>
          </div>

          <div className="stat bg-base-100 rounded-2xl shadow-sm border-2 border-status-warning">
            <div className="stat-figure text-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div className="stat-title font-semibold text-base-content/60">Score</div>
            <div className="stat-value text-warning">{calmyscore}</div>
          </div>
        </div>

        <div className="tabs tabs-boxed bg-base-200 p-2 w-max mb-6">
          <button
            className={`tab tab-lg font-bold ${techTab === "available" ? "tab-active bg-base-100 text-primary shadow-sm" : ""}`}
            onClick={() => setTechTab("available")}
          >
            Available <span className="badge badge-sm ml-2 bg-base-200">{availableTickets.length}</span>
          </button>
          <button
            className={`tab tab-lg font-bold ${techTab === "my-jobs" ? "tab-active bg-base-100 text-primary shadow-sm" : ""}`}
            onClick={() => setTechTab("my-jobs")}
          >
            My Jobs <span className="badge badge-sm ml-2 bg-base-200">{myJobs.length}</span>
          </button>
          <button
            className={`tab tab-lg font-bold ${techTab === "completed" ? "tab-active bg-base-100 text-primary shadow-sm" : ""}`}
            onClick={() => setTechTab("completed")}
          >
            Completed <span className="badge badge-sm ml-2 bg-base-200">{myCompleted.length}</span>
          </button>
        </div>

        {techTab === "available" && (
          <div className="animate-in fade-in">
            <div className="section-header">
              <h2 className="text-2xl font-bold text-base-content">Recommended for You</h2>
            </div>
            
            {recommended.length === 0 ? (
              <div className="card bg-base-100 shadow-sm border border-base-200 py-12 mb-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="text-5xl mb-4 opacity-50">🔍</div>
                  <h3 className="text-xl font-bold mb-2 text-base-content">No tasks for your specialty</h3>
                  <p className="text-base-content/60 max-w-sm">Check "Other Tasks" below for available work outside your primary category.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {recommended.map((ticket) => (
                  <div key={ticket.fix_id} className="card bg-base-100 shadow-sm border-status-info hover:shadow-md transition-shadow">
                    <div className="card-body p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Ticket #{ticket.fix_id}</div>
                        <div className="badge badge-info font-semibold gap-1 py-3 px-3 shadow-sm">Available</div>
                      </div>
                      
                      {ticket.approved_by && (
                        <div className="text-xs text-primary font-semibold mb-2">
                          Approved by: {ticket.approved_by}
                        </div>
                      )}

                      <h3 className="card-title text-lg font-bold mt-1 mb-3 text-base-content line-clamp-1">{ticket.fix_name}</h3>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="badge badge-outline text-xs">{ticket.category}</span>
                        {ticket.fix_location && (
                          <span className="text-xs text-base-content/60 flex items-center">
                            📍 {ticket.fix_location}
                          </span>
                        )}
                        <span className="text-xs text-base-content/60 flex items-center">
                          📅 {formatDate(ticket.report_date)}
                        </span>
                      </div>

                      <div className="bg-base-200/50 p-3 rounded-lg text-sm text-base-content/80 line-clamp-2 min-h-[3.5rem] mb-4">
                        {ticket.fix_detail}
                      </div>
                      
                      <button onClick={() => handletakejob(ticket)} className="btn btn-primary w-full mt-auto">
                        Take Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {others.length > 0 && (
              <>
                <div className="divider mb-6"></div>
                <div className="flex justify-between items-end mb-6 border-b border-base-200 pb-4">
                  <h2 className="text-xl font-bold text-base-content">Other Available Tasks</h2>
                  <div className="text-sm text-base-content/60">{others.length} tasks</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {others.map((ticket) => (
                    <div key={ticket.fix_id} className="card bg-base-100 shadow-sm border-status-info opacity-90 hover:opacity-100 hover:shadow-md transition-all">
                      <div className="card-body p-5">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Ticket #{ticket.fix_id}</div>
                          <div className="badge badge-info font-semibold gap-1 py-3 px-3 shadow-sm">Available</div>
                        </div>
                        
                        {ticket.approved_by && (
                          <div className="text-xs text-primary font-semibold mb-2">
                            Approved by: {ticket.approved_by}
                          </div>
                        )}

                        <h3 className="card-title text-lg font-bold mt-1 mb-3 text-base-content line-clamp-1">{ticket.fix_name}</h3>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="badge badge-outline text-xs">{ticket.category}</span>
                          {ticket.fix_location && (
                            <span className="text-xs text-base-content/60 flex items-center">
                              📍 {ticket.fix_location}
                            </span>
                          )}
                          <span className="text-xs text-base-content/60 flex items-center">
                            📅 {formatDate(ticket.report_date)}
                          </span>
                        </div>

                        <div className="bg-base-200/50 p-3 rounded-lg text-sm text-base-content/80 line-clamp-2 min-h-[3.5rem] mb-4">
                          {ticket.fix_detail}
                        </div>
                        
                        <button onClick={() => handletakejob(ticket)} className="btn btn-secondary btn-outline w-full mt-auto">
                          Take Job (Cross-Role)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {techTab === "my-jobs" && (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-end mb-6 border-b border-base-200 pb-4">
              <h2 className="text-2xl font-bold text-base-content">Tasks in Progress</h2>
              <div className="text-sm text-base-content/60">{myJobs.length} active</div>
            </div>

            {myJobs.length === 0 && myCancelRequests.length === 0 ? (
              <div className="card bg-base-100 shadow-sm border border-base-200 py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4 opacity-50">📭</div>
                  <h3 className="text-xl font-bold mb-2 text-base-content">No active jobs</h3>
                  <p className="text-base-content/60 max-w-sm">Go to the "Available" tab to pick up new work.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  {myJobs.map((ticket) => (
                    <div key={ticket.fix_id} className="card bg-base-100 shadow-md border-status-primary hover:shadow-lg transition-shadow">
                      <div className="card-body p-5 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Ticket #{ticket.fix_id}</div>
                          <div className="badge badge-primary font-semibold gap-1 py-3 px-3 shadow-sm">Working</div>
                        </div>
                        
                        {ticket.approved_by && (
                          <div className="text-xs text-primary font-semibold mb-2">
                            Approved by: {ticket.approved_by}
                          </div>
                        )}

                        <h3 className="card-title text-lg font-bold mt-1 mb-3 text-base-content">{ticket.fix_name}</h3>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="badge badge-outline text-xs">{ticket.category}</span>
                          {ticket.fix_location && (
                            <span className="text-xs text-base-content/60 flex items-center">
                              📍 {ticket.fix_location}
                            </span>
                          )}
                          <span className="text-xs text-base-content/60 flex items-center">
                            📅 {formatDate(ticket.report_date)}
                          </span>
                        </div>

                        <div className="bg-base-200/50 p-3 rounded-lg text-sm text-base-content/80 min-h-[3.5rem] mb-6 flex-grow">
                          {ticket.fix_detail}
                        </div>
                        
                        <div className="flex flex-col gap-2 mt-auto">
                          <button onClick={() => handleCompleteJob(ticket)} className="btn btn-success text-white w-full shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Mark as Completed
                          </button>
                          <button onClick={() => handleCancelJob(ticket)} className="btn btn-ghost btn-sm text-error/70 hover:text-error hover:bg-error/10 w-full">
                            Request Cancellation
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {myCancelRequests.length > 0 && (
                  <>
                    <div className="divider mb-6"></div>
                    <div className="flex items-center gap-2 mb-6 border-b border-base-200 pb-4">
                      <h2 className="text-xl font-bold text-warning">⏳ Pending Cancellation</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myCancelRequests.map((ticket) => (
                        <div key={ticket.fix_id} className="card bg-base-100 shadow-sm border-status-warning opacity-80">
                          <div className="card-body p-5">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Ticket #{ticket.fix_id}</div>
                              <div className="badge badge-warning font-semibold gap-1 py-3 px-3 shadow-sm">Awaiting Review</div>
                            </div>
                            
                            <h3 className="card-title text-lg font-bold mt-1 mb-4 text-base-content">{ticket.title || ticket.fix_name}</h3>
                            
                            <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg">
                              <div className="text-xs font-bold text-warning/80 uppercase tracking-wider mb-1">Your Reason</div>
                              <div className="text-sm font-medium text-base-content/80">
                                {ticket.cancellationReason || "No reason provided."}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {techTab === "completed" && (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-end mb-6 border-b border-base-200 pb-4">
              <h2 className="text-2xl font-bold text-base-content">Completed Jobs</h2>
              <div className="text-sm text-base-content/60">{myCompleted.length} total</div>
            </div>
            
            {myCompleted.length === 0 ? (
              <div className="card bg-base-100 shadow-sm border border-base-200 py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4 opacity-50">✅</div>
                  <h3 className="text-xl font-bold mb-2 text-base-content">No completed jobs yet</h3>
                  <p className="text-base-content/60 max-w-sm">Complete your first job to see it here.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCompleted.map((ticket) => (
                  <div key={ticket.fix_id} className="card bg-base-100 shadow-sm border-status-success opacity-90">
                    <div className="card-body p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Ticket #{ticket.fix_id}</div>
                        <div className="badge badge-success font-semibold gap-1 py-3 px-3 shadow-sm text-white">Completed</div>
                      </div>
                      
                      {ticket.approved_by && (
                        <div className="text-xs text-primary font-semibold mb-2">
                          Approved by: {ticket.approved_by}
                        </div>
                      )}

                      <h3 className="card-title text-lg font-bold mt-1 mb-3 text-base-content line-clamp-1">{ticket.fix_name}</h3>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="badge badge-outline text-xs">{ticket.category}</span>
                        {ticket.fix_location && (
                          <span className="text-xs text-base-content/60 flex items-center">
                            📍 {ticket.fix_location}
                          </span>
                        )}
                        <span className="text-xs text-base-content/60 flex items-center">
                          📅 {formatDate(ticket.report_date)}
                        </span>
                      </div>

                      <div className="bg-base-200/50 p-3 rounded-lg text-sm text-base-content/80 line-clamp-3">
                        {ticket.fix_detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TechnicianPage />
    </Suspense>
  );
}
