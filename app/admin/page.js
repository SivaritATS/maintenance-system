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
  const { currentUser, tickets, updateTicketStatus, updateUserScore, users, setCurrentUser } =
    useMaintenance();
  const router = useRouter();
  const [operatorinfo, setOperatorInfo] = useState([]);
  const [activeStatus, setActiveStatus] = useState("actionable");
  const [decryptuser, setDecryptUser] = useState(null);
  const searchParams = useSearchParams();
  const [fixdata, setFixData] = useState([]);
  const [jobcancle, setJobcancle] = useState([]);
  const [scoreMap, setScoreMap] = useState({});

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
    const validateUser = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/getoperator`,
          {
            id: decryptuser,
          },
        );
        if (response.status === 200 && response.data && response.data.length > 0) {
          const data = response.data[0];
          setOperatorInfo(data);
          setCurrentUser({
            id: data.operator_id,
            name: `${data.fnames} ${data.lnames}`,
            role: "admin",
            score: data.credit
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
      `${process.env.NEXT_PUBLIC_URL}/api/getscore`,
      {
        id: id,
      },
    );
    if (response.status === 200) {
      const data = response.data;
      let total = 0;
      data.forEach((item) => {
        total += item.earn;
      });
      return data.length > 0 ? total / data.length : 0;
    }
    return null;
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
            title: `Approved for ticket no: ${ticket.fix_no}`,
            text: `${ticket.fix_no} has been approved`,
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
            `${process.env.NEXT_PUBLIC_URL}/api/addscore/`,
            {
              operator: ticket.operator,
              detail: "Bad reason",
              earn: -5,
              fix_id: ticket.fix_no,
            },
          );
          if (response2.status === 200) {
            Swal.fire({
              icon: "success",
              title: `rejected for ticket no: ${ticket.fix_no} -5 score`,
              text: `${ticket.fix_no} has been rejected -5 score`,
            });
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
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_URL}/api/updatestatus/updatebyid`,
        {
          status: "approved",
          id: ticket.fix_id,
        },
      );
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: `ticket approved `,
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

  return (
    <>
      <Header />
      <div className="container animate-in">
        {/* Stats */}
        <div className="stats-row">
          <div
            className="stat-card"
            onClick={() => setActiveStatus("actionable")}
            style={{
              cursor: "pointer",
              borderColor:
                activeStatus === "actionable" ? "var(--warning-500)" : "",
              borderWidth: activeStatus === "actionable" ? "2px" : "",
            }}
          >
            <div className="stat-icon amber">⏳</div>
            <div>
              <div className="stat-value">{pendingTickets.length}</div>
              <div className="stat-label">Pending Review</div>
            </div>
          </div>
          <div
            className="stat-card"
            onClick={() => setActiveStatus("actionable")}
            style={{
              cursor: "pointer",
              borderColor:
                activeStatus === "actionable" ? "var(--danger-500)" : "",
              borderWidth: activeStatus === "actionable" ? "2px" : "",
            }}
          >
            <div className="stat-icon red">🚫</div>
            <div>
              <div className="stat-value">{cancellationRequests.length}</div>
              <div className="stat-label">Cancel Requests</div>
            </div>
          </div>
          <div
            className="stat-card"
            onClick={() => setActiveStatus("approved")}
            style={{
              cursor: "pointer",
              borderColor: activeStatus === "approved" ? "var(--info-500)" : "",
              borderWidth: activeStatus === "approved" ? "2px" : "",
            }}
          >
            <div className="stat-icon blue">🔧</div>
            <div>
              <div className="stat-value">{allApproved.length}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>
          <div
            className="stat-card"
            onClick={() => setActiveStatus("completed")}
            style={{
              cursor: "pointer",
              borderColor:
                activeStatus === "completed" ? "var(--success-500)" : "",
              borderWidth: activeStatus === "completed" ? "2px" : "",
            }}
          >
            <div className="stat-icon green">✅</div>
            <div>
              <div className="stat-value">{allCompleted.length}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </div>

        {activeStatus === "actionable" ? (
          <>
            {/* Pending Section */}
            <div className="section-header">
              <h2 className="section-title">Pending Review</h2>
              <span className="section-subtitle">
                {pendingTickets.length} items
              </span>
            </div>

            {pendingTickets.length === 0 &&
            cancellationRequests.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🎉</div>
                  <div className="empty-state-title">All Clear!</div>
                  <div className="empty-state-desc">
                    No pending reports or cancellations to review.
                  </div>
                </div>
              </div>
            ) : (
              <>
                {pendingTickets.length > 0 && (
                  <div className="ticket-grid" style={{ marginBottom: "2rem" }}>
                    {pendingTickets.map((ticket) => (
                      <div
                        key={ticket.fix_id}
                        className={`ticket-card ${getCategoryClass(ticket.category)}`}
                      >
                        <div className="ticket-header">
                          <span className="ticket-id">
                            #{ticket.fix_id} • {ticket.reporter}
                          </span>
                          <span className="status-badge status-pending">
                            Pending
                          </span>
                        </div>
                        <div className="ticket-title">{ticket.fix_name}</div>
                        <div className="ticket-meta">
                          <span>{ticket.category}</span>
                          <span className="dot"></span>
                          <span>{ticket.report_date}</span>
                        </div>
                        <div className="ticket-desc">{ticket.fix_detail}</div>
                        <div className="ticket-actions">
                          <button
                            onClick={() => handlingrequestapprove(ticket)}
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1 }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handlingrequestreject(ticket)}
                            className="btn btn-danger btn-sm"
                            style={{ flex: 1 }}
                          >
                            ✕ Reject
                          </button>
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
                <hr className="divider" />
                <div className="section-header">
                  <h2
                    className="section-title"
                    style={{ color: "var(--danger-500)" }}
                  >
                    ⚠️ Cancellation Requests
                  </h2>
                  <span className="section-subtitle">
                    {cancellationRequests.length} requests
                  </span>
                </div>
                <div className="ticket-grid">
                  {cancellationRequests.map((ticket) => {
                    const techUser = users.find(
                      (u) => u.id === ticket.operator,
                    );

                    const techName =
                      techUser && techUser.operator
                        ? techUser.operator
                        : (ticket.operator ?? "Unassigned");
                    const techScore = scoreMap[ticket.operator] ?? "?";

                    return (
                      <div
                        key={ticket.fix_no}
                        className="ticket-card"
                        style={{ borderColor: "var(--danger-200)" }}
                      >
                        <div className="ticket-header">
                          <span className="ticket-id">#{ticket.fix_no}</span>
                          <span className="status-badge status-rejected">
                            Cancel Request
                          </span>
                        </div>
                        <div className="ticket-title">{ticket.fix_no}</div>
                        <div className="ticket-meta">
                          <span>🔧 {techName}</span>
                          <span className="dot"></span>
                          <span>Score: {techScore}</span>
                        </div>

                        <div className="reason-box">
                          <div className="reason-box-label">Reason</div>
                          <div className="reason-box-text">{ticket.detail}</div>
                        </div>

                        <div className="ticket-actions">
                          <button
                            onClick={() => handlingcancleapprove(ticket)}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1 }}
                          >
                            Allow
                          </button>
                          <button
                            onClick={() => handlingcanclerejected(ticket)}
                            className="btn btn-danger btn-sm"
                            style={{ flex: 1 }}
                          >
                            Reject (-0.5)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="section-header">
              <h2 className="section-title">
                {activeStatus === "approved" ? "In Progress" : "Completed Jobs"}
              </h2>
              <span className="section-subtitle">
                {filteredList.length} items
              </span>
            </div>
            {filteredList.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-title">No tickets found</div>
                  <div className="empty-state-desc">
                    No tickets in this status.
                  </div>
                </div>
              </div>
            ) : (
              <div className="ticket-grid">
                {filteredList.map((ticket) => {
                  const techUser = users.find(
                    (u) => u.id === ticket.assigneeId,
                  );
                  const techName = techUser?.operator ?? "Unassigned";

                  return (
                    <div
                      key={ticket.fix_id}
                      className={`ticket-card ${getCategoryClass(ticket.category)}`}
                    >
                      <div className="ticket-header">
                        <span className="ticket-id">#{ticket.fix_id}</span>
                        <span
                          className={`status-badge status-${ticket.fix_status.replace(" ", "-")}`}
                        >
                          {ticket.fix_status === "approved"
                            ? "In Progress"
                            : ticket.fix_status}
                        </span>
                      </div>
                      <div className="ticket-title">{ticket.fix_name}</div>
                      <div className="ticket-meta">
                        <span>{ticket.category}</span>
                        <span className="dot"></span>
                        <span>🔧 {ticket.operator ?? "Unassigned"}</span>
                        <span className="dot"></span>
                        <span>{ticket.report_date}</span>
                      </div>
                      <div className="ticket-desc">{ticket.fix_detail}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
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
