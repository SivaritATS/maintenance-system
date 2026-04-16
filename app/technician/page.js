"use client";
import { useState, useEffect, Suspense } from "react";
import { useMaintenance } from "../context/MaintenanceContext";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Swal from "sweetalert2";
import { decrypt } from "@/encrypt";
import axios from "axios";

function TechnicianPage() {
  const { currentUser, tickets, updateTicketStatus, updateUserScore } =
    useMaintenance();
  const router = useRouter();
  const [techTab, setTechTab] = useState("available");
  const [decryptuser, setDecryptUser] = useState(null);
  const searchParams = useSearchParams();
  const [fixdata, setFixData] = useState([]);
  const [operatorinfo, setOperatorInfo] = useState([]);
  const [scoredata, setScoredata] = useState([]);

  useEffect(() => {
    const encryptedId = searchParams.get("id");
    if (!encryptedId) {
      router.push("/");
      return;
    }
    const loginId = encryptedId
      ? decrypt(decodeURIComponent(encryptedId))
      : null;
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
        Swal.fire({
          icon: "error",
          title: "Unable to Synchronize with database",
          text: "Unauthorized to access this page.",
        });
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
        setOperatorInfo(response.data[0]);
        getfixs();
        getscore();
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
        Swal.fire({
          icon: "error",
          title: "Unable to Synchronize with database",
          text: "Unauthorized to access this page.",
        });
      }
    };

    validateUser();
  }, [decryptuser]);

  const handletakejob = async (ticket) => {
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
  const calmyscore =
    Array.isArray(scoredata) && scoredata.length > 0
      ? scoredata.reduce((sum, item) => sum + item.earn, 0) / scoredata.length
      : 0;

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
      operatorinfo.category === "General",
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
        const response5 = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/addscore`,
          {
            operator: decryptuser,
            detail: "completed task",
            earn: 5,
            fix_id: ticket.fix_id,
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
      inputPlaceholder: "Why are you cancelling this  job?",
      inputAttributes: { "aria-label": "Type your reason here" },
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Submit Request",
      cancelButtonText: "Go Back",
    });

    if (reason) {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/jobcancle`,
          {
            id: Number(ticket.fix_id),
            detail: reason,
            operator: decryptuser,
            status: "pending",
          },
        );
        if (response.status === 200) {
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
      }
    }
  };

  return (
    <>
      <Header />
      <div className="container animate-in">
        <div className="stats-row">
          <div
            className="stat-card"
            onClick={() => setTechTab("available")}
            style={{
              cursor: "pointer",
              borderColor: techTab === "available" ? "var(--info-500)" : "",
              borderWidth: techTab === "available" ? "2px" : "",
            }}
          >
            <div className="stat-icon blue">📋</div>
            <div>
              <div className="stat-value">{availableTickets.length}</div>
              <div className="stat-label">Available</div>
            </div>
          </div>
          <div
            className="stat-card"
            onClick={() => setTechTab("my-jobs")}
            style={{
              cursor: "pointer",
              borderColor: techTab === "my-jobs" ? "var(--primary-500)" : "",
              borderWidth: techTab === "my-jobs" ? "2px" : "",
            }}
          >
            <div className="stat-icon purple">🔧</div>
            <div>
              <div className="stat-value">{myJobs.length}</div>
              <div className="stat-label">Active Jobs</div>
            </div>
          </div>
          <div
            className="stat-card"
            onClick={() => setTechTab("completed")}
            style={{
              cursor: "pointer",
              borderColor: techTab === "completed" ? "var(--success-500)" : "",
              borderWidth: techTab === "completed" ? "2px" : "",
            }}
          >
            <div className="stat-icon green">✅</div>
            <div>
              <div className="stat-value">{myCompleted.length}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">★</div>
            <div>
              <div className="stat-value">{calmyscore}</div>
              <div className="stat-label">Score</div>
            </div>
          </div>
        </div>

        <div className="tabs">
          <div
            className={`tab ${techTab === "available" ? "active" : ""}`}
            onClick={() => setTechTab("available")}
          >
            Available ({availableTickets.length})
          </div>
          <div
            className={`tab ${techTab === "my-jobs" ? "active" : ""}`}
            onClick={() => setTechTab("my-jobs")}
          >
            My Jobs ({myJobs.length})
          </div>
          <div
            className={`tab ${techTab === "completed" ? "active" : ""}`}
            onClick={() => setTechTab("completed")}
          >
            Completed ({myCompleted.length})
          </div>
        </div>

        {techTab === "available" && (
          <div>
            <div className="section-header">
              <h2 className="section-title">Recommended for You</h2>
            </div>
            {recommended.length === 0 ? (
              <div className="card" style={{ marginBottom: "2rem" }}>
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">
                    No tasks for your specialty
                  </div>
                  <div className="empty-state-desc">
                    Check "Other Tasks" below for available work.
                  </div>
                </div>
              </div>
            ) : (
              <div className="ticket-grid" style={{ marginBottom: "2rem" }}>
                {recommended.map((ticket) => (
                  <div
                    key={ticket.fix_id}
                    className={`ticket-card ${getCategoryClass(ticket.category)}`}
                  >
                    <div className="ticket-header">
                      <span className="ticket-id">Ticket #{ticket.fix_id}</span>
                      <span className="status-badge status-approved">
                        Available
                      </span>
                    </div>
                    <div className="ticket-title">{ticket.fix_name}</div>
                    <div className="ticket-meta">
                      <span>{ticket.category}</span>
                    </div>
                    <div className="ticket-desc">{ticket.fix_detail}</div>
                    <button
                      onClick={() => handletakejob(ticket)}
                      className="btn btn-primary btn-full"
                    >
                      Take Job
                    </button>
                  </div>
                ))}
              </div>
            )}

            {others.length > 0 && (
              <>
                <hr className="divider" />
                <div className="section-header">
                  <h2 className="section-title">Other Available Tasks</h2>
                  <span className="section-subtitle">
                    {others.length} tasks
                  </span>
                </div>
                <div className="ticket-grid">
                  {others.map((ticket) => (
                    <div
                      key={ticket.fix_id}
                      className={`ticket-card ${getCategoryClass(ticket.category)}`}
                      style={{ opacity: 0.85 }}
                    >
                      <div className="ticket-header">
                        <span className="ticket-id">
                          Ticket #{ticket.fix_id}
                        </span>
                        <span className="status-badge status-approved">
                          Available
                        </span>
                      </div>
                      <div className="ticket-title">{ticket.fix_name}</div>
                      <div className="ticket-meta">
                        <span>{ticket.category}</span>
                      </div>
                      <div className="ticket-desc">{ticket.fix_detail}</div>
                      <button
                        onClick={() => handletakejob(ticket)}
                        className="btn btn-secondary btn-full"
                      >
                        Take Job (Cross-Role)
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {techTab === "my-jobs" && (
          <div>
            <div className="section-header">
              <h2 className="section-title">Tasks in Progress</h2>
              <span className="section-subtitle">{myJobs.length} active</span>
            </div>

            {myJobs.length === 0 && myCancelRequests.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-title">No active jobs</div>
                  <div className="empty-state-desc">
                    Go to "Available" tab to pick up work.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="ticket-grid" style={{ marginBottom: "2rem" }}>
                  {myJobs.map((ticket) => (
                    <div
                      key={ticket.fix_id}
                      className={`ticket-card ${getCategoryClass(ticket.category)}`}
                      style={{ borderLeft: "4px solid var(--primary-500)" }}
                    >
                      <div className="ticket-header">
                        <span className="ticket-id">
                          Ticket #{ticket.fix_id}
                        </span>
                        <span className="status-badge status-approved">
                          Working
                        </span>
                      </div>
                      <div className="ticket-title">{ticket.fix_name}</div>
                      <div className="ticket-meta">
                        <span>{ticket.category}</span>
                      </div>
                      <div className="ticket-desc">{ticket.fix_detail}</div>
                      <div
                        className="ticket-actions"
                        style={{ flexDirection: "column" }}
                      >
                        <button
                          onClick={() => handleCompleteJob(ticket)}
                          className="btn btn-success btn-full"
                        >
                          ✓ Mark as Completed
                        </button>
                        <button
                          onClick={() => handleCancelJob(ticket)}
                          className="btn btn-ghost btn-full"
                          style={{
                            color: "var(--danger-500)",
                            fontSize: "0.8rem",
                            marginTop: "0.25rem",
                          }}
                        >
                          Request Cancellation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {myCancelRequests.length > 0 && (
                  <>
                    <hr className="divider" />
                    <div className="section-header">
                      <h2
                        className="section-title"
                        style={{ color: "var(--warning-600)" }}
                      >
                        ⏳ Pending Cancellation
                      </h2>
                    </div>
                    <div className="ticket-grid">
                      {myCancelRequests.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="ticket-card"
                          style={{
                            borderLeft: "4px solid var(--warning-500)",
                            opacity: 0.7,
                          }}
                        >
                          <div className="ticket-header">
                            <span className="ticket-id">
                              Ticket #{ticket.id}
                            </span>
                            <span className="status-badge status-cancellation_requested">
                              Awaiting
                            </span>
                          </div>
                          <div className="ticket-title">{ticket.title}</div>
                          <div className="reason-box">
                            <div className="reason-box-label">Your Reason</div>
                            <div className="reason-box-text">
                              {ticket.cancellationReason}
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
          <div>
            <div className="section-header">
              <h2 className="section-title">Completed Jobs</h2>
              <span className="section-subtitle">
                {myCompleted.length} total
              </span>
            </div>
            {myCompleted.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <div className="empty-state-title">No completed jobs yet</div>
                  <div className="empty-state-desc">
                    Complete your first job to see it here.
                  </div>
                </div>
              </div>
            ) : (
              <div className="ticket-grid">
                {myCompleted.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`ticket-card ${getCategoryClass(ticket.category)}`}
                    style={{ opacity: 0.9 }}
                  >
                    <div className="ticket-header">
                      <span className="ticket-id">Ticket #{ticket.fix_id}</span>
                      <span className="status-badge status-completed">
                        Completed
                      </span>
                    </div>
                    <div className="ticket-title">{ticket.fix_name}</div>
                    <div className="ticket-meta">
                      <span>{ticket.category}</span>
                      <span className="dot"></span>
                      <span>{ticket.report_date}</span>
                    </div>
                    <div className="ticket-desc">{ticket.fix_detail}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
