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
  const { currentUser, tickets, createTicket } = useMaintenance();
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
    const validateuser = async () => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/api/getstudent/byid`,
        {
          id: decryptuser,
        },
      );
      if (response.status === 200) {
        const data = response.data[0];
        setName(data.fnames);
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
    };
    const getdata = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/api/fixs/studentreport`,
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
  }, [decryptuser, router]);

  if (!decryptuser) return null;

  const myTickets = tickets.filter((t) => t.reporterId === decryptuser);
  const pendingCount = data.filter((t) => t.fix_status === "pending").length;
  const approvedCount = data.filter((t) => t.fix_status === "approved").length;
  const completedCount = data.filter(
    (t) => t.fix_status === "completed",
  ).length;

  const filteredTickets = myTickets.filter((t) => {
    if (activeStatus === "all") return true;
    if (activeStatus === "in_progress") return t.status === "approved";
    return t.status === activeStatus;
  });

  const getStatusLabel = (status) => {
    switch (status) {
      case "approved":
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
      <div className="container animate-in">
        <div className="stats-row">
          <div
            className="stat-card"
            onClick={() => setActiveStatus("all")}
            style={{
              cursor: "pointer",
              borderColor: activeStatus === "all" ? "var(--primary-500)" : "",
              borderWidth: activeStatus === "all" ? "2px" : "",
            }}
          >
            <div className="stat-icon purple">📝</div>
            <div>
              <div className="stat-value">{myTickets.length}</div>
              <div className="stat-label">Total Reports</div>
            </div>
          </div>

          <div
            className="stat-card"
            onClick={() => setActiveStatus("pending")}
            style={{
              cursor: "pointer",
              borderColor:
                activeStatus === "pending" ? "var(--warning-500)" : "",
              borderWidth: activeStatus === "pending" ? "2px" : "",
            }}
          >
            <div className="stat-icon amber">⏳</div>
            <div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div
            className="stat-card"
            onClick={() => setActiveStatus("in_progress")}
            style={{
              cursor: "pointer",
              borderColor:
                activeStatus === "in_progress" ? "var(--info-500)" : "",
              borderWidth: activeStatus === "in_progress" ? "2px" : "",
            }}
          >
            <div className="stat-icon blue">🔧</div>
            <div>
              <div className="stat-value">{approvedCount}</div>
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
              <div className="stat-value">{completedCount}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </div>

        <div className="page-grid page-grid-2">
          <div
            className="card"
            style={{ alignSelf: "start", position: "sticky", top: "80px" }}
          >
            <div className="card-header">
              <h2 className="card-title">📋 New Report</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Issue Title</label>
                <input
                  className="form-input"
                  value={newTicket.title}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, title: e.target.value })
                  }
                  placeholder="e.g. Broken Projector in Room 304"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={newTicket.category}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, category: e.target.value })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  className="form-input"
                  value={newTicket.location}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, location: e.target.value })
                  }
                  placeholder="e.g. 11-101 Auditorium"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                  placeholder="Describe the problem in detail..."
                  rows={4}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full">
                Submit Report
              </button>
            </form>
          </div>

          <div>
            <div className="section-header">
              <h2 className="section-title">My Reports</h2>
              <span className="section-subtitle">{data.length} total</span>
            </div>

            {data.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-title">No reports found</div>
                  <div className="empty-state-desc">
                    Try changing the filter or submit a new report.
                  </div>
                </div>
              </div>
            ) : (
              <div className="ticket-grid">
                {data.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`ticket-card ${getCategoryClass(ticket.category)}`}
                  >
                    <div className="ticket-header">
                      <span className="ticket-id">Ticket #{ticket.fix_id}</span>
                      <span
                        className={`status-badge status-${ticket.fix_status.replace(
                          " ",
                          "-",
                        )}`}
                      >
                        {getStatusLabel(ticket.fix_status)}
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
        </div>
      </div>
    </>
  );
}
