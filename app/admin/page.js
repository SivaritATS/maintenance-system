'use client';
import { useEffect } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function AdminPage() {
  const { currentUser, tickets, updateTicketStatus, updateUserScore, users } = useMaintenance();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) router.push('/');
  }, [currentUser, router]);

  if (!currentUser) return null;

  const pendingTickets = tickets.filter(t => t.status === 'pending');
  const cancellationRequests = tickets.filter(t => t.status === 'cancellation_requested');
  const allApproved = tickets.filter(t => t.status === 'approved').length;
  const allCompleted = tickets.filter(t => t.status === 'completed').length;
  const allRejected = tickets.filter(t => t.status === 'rejected').length;
  
  const handleCancellation = (ticket, isApproved) => {
    const techUser = users.find(u => u.id === ticket.assigneeId);
    const techName = techUser ? techUser.name : ticket.assigneeId;

    if (isApproved) {
      updateTicketStatus(ticket.id, 'approved', null);
      MySwal.fire('Allowed', `Cancellation approved for ${techName}. No penalty applied.`, 'success');
    } else {
      updateTicketStatus(ticket.id, 'approved', null);
      updateUserScore(ticket.assigneeId, -0.5);
      MySwal.fire('Penalized', `0.5 points deducted from ${techName}.`, 'warning');
    }
  };

  const getCategoryClass = (cat) => {
    if (cat.includes('Public')) return 'cat-Public';
    return `cat-${cat}`;
  };
  
  return (
    <>
      <Header />
      <div className="container animate-in">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon amber">⏳</div>
            <div>
              <div className="stat-value">{pendingTickets.length}</div>
              <div className="stat-label">Pending Review</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">🚫</div>
            <div>
              <div className="stat-value">{cancellationRequests.length}</div>
              <div className="stat-label">Cancel Requests</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">🔧</div>
            <div>
              <div className="stat-value">{allApproved}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div>
              <div className="stat-value">{allCompleted}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </div>

        {/* Pending Section */}
        <div className="section-header">
          <h2 className="section-title">Pending Review</h2>
          <span className="section-subtitle">{pendingTickets.length} items</span>
        </div>
        
        {pendingTickets.length === 0 && cancellationRequests.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🎉</div>
              <div className="empty-state-title">All Clear!</div>
              <div className="empty-state-desc">No pending reports or cancellations to review.</div>
            </div>
          </div>
        ) : (
          <>
            {pendingTickets.length > 0 && (
              <div className="ticket-grid" style={{ marginBottom: '2rem' }}>
                {pendingTickets.map(ticket => (
                  <div key={ticket.id} className={`ticket-card ${getCategoryClass(ticket.category)}`}>
                    <div className="ticket-header">
                      <span className="ticket-id">#{ticket.id} • {ticket.reporterId}</span>
                      <span className="status-badge status-pending">Pending</span>
                    </div>
                    <div className="ticket-title">{ticket.title}</div>
                    <div className="ticket-meta">
                      <span>{ticket.category}</span>
                      <span className="dot"></span>
                      <span>{ticket.createdAt}</span>
                    </div>
                    <div className="ticket-desc">{ticket.description}</div>
                    <div className="ticket-actions">
                      <button 
                        onClick={() => updateTicketStatus(ticket.id, 'approved')} 
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        onClick={() => updateTicketStatus(ticket.id, 'rejected')} 
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
              <h2 className="section-title" style={{ color: 'var(--danger-500)' }}>⚠️ Cancellation Requests</h2>
              <span className="section-subtitle">{cancellationRequests.length} requests</span>
            </div>
            <div className="ticket-grid">
              {cancellationRequests.map(ticket => {
                const techUser = users.find(u => u.id === ticket.assigneeId);
                const techName = techUser ? techUser.name : ticket.assigneeId;
                const techScore = techUser ? techUser.score : '?';

                return (
                  <div key={ticket.id} className="ticket-card" style={{ borderColor: 'var(--danger-200)' }}>
                    <div className="ticket-header">
                      <span className="ticket-id">#{ticket.id}</span>
                      <span className="status-badge status-rejected">Cancel Request</span>
                    </div>
                    <div className="ticket-title">{ticket.title}</div>
                    <div className="ticket-meta">
                      <span>🔧 {techName}</span>
                      <span className="dot"></span>
                      <span>Score: {techScore}</span>
                    </div>
                    
                    <div className="reason-box">
                      <div className="reason-box-label">Reason</div>
                      <div className="reason-box-text">{ticket.cancellationReason}</div>
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
      </div>
    </>
  );
}
