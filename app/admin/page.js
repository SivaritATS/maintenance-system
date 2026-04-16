"use client";
import { useState, useEffect } from "react";
import { useMaintenance } from "../context/MaintenanceContext";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { decrypt } from "@/encrypt";
import axios from "axios";

const MySwal = withReactContent(Swal);

export default function AdminPage() {
  const { currentUser, tickets, updateTicketStatus, updateUserScore, users } =
    useMaintenance();
  const router = useRouter();
  const [operatorinfo, setOperatorInfo] = useState([]);
  const [activeStatus, setActiveStatus] = useState("actionable");
  const [decryptuser, setDecryptUser] = useState(null);
  const searchParams = useSearchParams();
  const [fixdata, setFixData] = useState([]);
  const [jobcancle, setJobcancle] = useState([]);
  // useEffect(() => {
  //   if (!currentUser) router.push("/");
  // }, [currentUser, router]);

  // if (!currentUser) return null;

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
    const validateUser = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/getoperator`,
          {
            id: decryptuser,
          },
        );
        if (response.status === 200) {
          setOperatorInfo(response.data[0]);
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
        Swal.fire({
          icon: "error",
          title: "Unable to synchronize with database",
          text: "Connectiom to database was losted.",
        });
      }
    };
    validateUser();
    getinformation();
  }, [decryptuser]);
  // console.log(fixdata);
  const pendingTickets = fixdata.filter((t) => t.fix_status === "pending");
  const cancellationRequests = jobcancle.filter((t) => t.status === "pending");
  const allApproved = fixdata.filter((t) => t.fix_status === "approved");
  const allCompleted = fixdata.filter((t) => t.fix_status === "completed");

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
    const techUser = users.find((u) => u.id === ticket.assigneeId);
    const techName = techUser ? techUser.name : ticket.assigneeId;

    if (isApproved) {
      updateTicketStatus(ticket.id, "approved", null);
      MySwal.fire(
        "Allowed",
        `Cancellation approved for ${techName}. No penalty applied.`,
        "success",
      );
    } else {
      updateTicketStatus(ticket.id, "approved", null);
      updateUserScore(ticket.assigneeId, -0.5);
      MySwal.fire(
        "Penalized",
        `0.5 points deducted from ${techName}.`,
        "warning",
      );
    }
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
                            onClick={() =>
                              updateTicketStatus(ticket.fix_id, "approved")
                            }
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1 }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() =>
                              updateTicketStatus(ticket.id, "rejected")
                            }
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
                      (u) => u.id === ticket.assigneeId,
                    );
                    const techName = techUser
                      ? techUser.name
                      : ticket.assigneeId;
                    const techScore = techUser ? techUser.score : "?";

                    return (
                      <div
                        key={ticket.id}
                        className="ticket-card"
                        style={{ borderColor: "var(--danger-200)" }}
                      >
                        <div className="ticket-header">
                          <span className="ticket-id">#{ticket.fix_no}</span>
                          <span className="status-badge status-rejected">
                            Cancel Request
                          </span>
                        </div>
                        <div className="ticket-title">{ticket.title}</div>
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
                            onClick={() => handleCancellation(ticket, true)}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1 }}
                          >
                            Allow
                          </button>
                          <button
                            onClick={() => handleCancellation(ticket, false)}
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
                  const techName = techUser ? techUser.name : "Unassigned";

                  return (
                    <div
                      key={ticket.id}
                      className={`ticket-card ${getCategoryClass(ticket.category)}`}
                    >
                      <div className="ticket-header">
                        <span className="ticket-id">#{ticket.id}</span>
                        <span
                          className={`status-badge status-${ticket.status.replace(" ", "-")}`}
                        >
                          {ticket.status === "approved"
                            ? "In Progress"
                            : ticket.status}
                        </span>
                      </div>
                      <div className="ticket-title">{ticket.title}</div>
                      <div className="ticket-meta">
                        <span>{ticket.category}</span>
                        <span className="dot"></span>
                        <span>🔧 {techName}</span>
                        <span className="dot"></span>
                        <span>{ticket.createdAt}</span>
                      </div>
                      <div className="ticket-desc">{ticket.description}</div>
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
