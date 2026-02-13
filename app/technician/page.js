'use client';
import { useState, useEffect } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Swal from 'sweetalert2';

export default function TechnicianPage() {
  const { currentUser, tickets, updateTicketStatus, updateUserScore } = useMaintenance();
  const router = useRouter();
  const [techTab, setTechTab] = useState('available');

  useEffect(() => {
    if (!currentUser) router.push('/');
  }, [currentUser, router]);

  if (!currentUser) return null;

  const availableTickets = tickets.filter(t => t.status === 'approved' && !t.assigneeId);
  const myJobs = tickets.filter(t => t.assigneeId === currentUser.id && t.status !== 'completed' && t.status !== 'cancellation_requested');
  const myCompleted = tickets.filter(t => t.assigneeId === currentUser.id && t.status === 'completed');
  const myCancelRequests = tickets.filter(t => t.assigneeId === currentUser.id && t.status === 'cancellation_requested');

  const recommended = availableTickets.filter(t => t.category === currentUser.specialty || currentUser.specialty === 'General');
  const others = availableTickets.filter(t => t.category !== currentUser.specialty && currentUser.specialty !== 'General');

  const getCategoryClass = (cat) => {
    if (cat.includes('Public')) return 'cat-Public';
    return `cat-${cat}`;
  };

  const handleCompleteJob = async (ticket) => {
    const { value: formValues } = await Swal.fire({
      title: '✅ Complete Job',
      html: `
        <div style="text-align: left; font-size: 0.9rem;">
          <div style="margin-bottom: 1.25rem; padding: 1rem; background: #f3f4f6; border-radius: 12px;">
            <p style="margin-bottom: 0.4rem; color: #6b7280; font-size: 0.8rem;">TECHNICIAN</p>
            <p style="margin-bottom: 0.25rem; font-weight: 600;">${currentUser.name}</p>
            <p style="margin: 0; color: #9ca3af; font-size: 0.85rem;">ID: ${currentUser.id}</p>
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
      confirmButtonText: 'Submit & Complete',
      confirmButtonColor: '#10b981',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const imageInput = document.getElementById('swal-input-image');
        if (!imageInput.files || imageInput.files.length === 0) {
          Swal.showValidationMessage('Please upload a photo of the completed work');
          return false;
        }
        return { image: imageInput.files[0] };
      }
    });

    if (formValues) {
      updateTicketStatus(ticket.id, 'completed');
      updateUserScore(currentUser.id, 0.5);
      Swal.fire({
        icon: 'success',
        title: 'Job Completed! 🎉',
        text: '+0.5 Score earned!',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const handleCancelJob = async (ticket) => {
    const { value: reason } = await Swal.fire({
      title: '⚠️ Request Cancellation',
      input: 'textarea',
      inputLabel: 'Reason for cancellation',
      inputPlaceholder: 'Why are you cancelling this job?',
      inputAttributes: { 'aria-label': 'Type your reason here' },
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Submit Request',
      cancelButtonText: 'Go Back'
    });

    if (reason) {
      updateTicketStatus(ticket.id, 'cancellation_requested', undefined, reason);
      Swal.fire({
        icon: 'info',
        title: 'Request Sent',
        text: 'Cancellation request sent to admin for review.',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  return (
    <>
      <Header />
      <div className="container animate-in">
        {/* Stats */}
        <div className="stats-row">
          <div
            className="stat-card"
            onClick={() => setTechTab('available')}
            style={{
              cursor: 'pointer',
              borderColor: techTab === 'available' ? 'var(--info-500)' : '',
              borderWidth: techTab === 'available' ? '2px' : ''
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
            onClick={() => setTechTab('my-jobs')}
            style={{
              cursor: 'pointer',
              borderColor: techTab === 'my-jobs' ? 'var(--primary-500)' : '',
              borderWidth: techTab === 'my-jobs' ? '2px' : ''
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
            onClick={() => setTechTab('completed')}
            style={{
              cursor: 'pointer',
              borderColor: techTab === 'completed' ? 'var(--success-500)' : '',
              borderWidth: techTab === 'completed' ? '2px' : ''
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
              <div className="stat-value">{currentUser.score ?? 5}</div>
              <div className="stat-label">Score</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div className={`tab ${techTab === 'available' ? 'active' : ''}`} onClick={() => setTechTab('available')}>
            Available ({availableTickets.length})
          </div>
          <div className={`tab ${techTab === 'my-jobs' ? 'active' : ''}`} onClick={() => setTechTab('my-jobs')}>
            My Jobs ({myJobs.length})
          </div>
          <div className={`tab ${techTab === 'completed' ? 'active' : ''}`} onClick={() => setTechTab('completed')}>
            Completed ({myCompleted.length})
          </div>
        </div>

        {/* Available Tab */}
        {techTab === 'available' && (
          <div>
            {/* Recommended */}
            <div className="section-header">
              <h2 className="section-title">Recommended for You</h2>
              <span className="section-subtitle">{currentUser.specialty}</span>
            </div>
            {recommended.length === 0 ? (
              <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">No tasks for your specialty</div>
                  <div className="empty-state-desc">Check "Other Tasks" below for available work.</div>
                </div>
              </div>
            ) : (
              <div className="ticket-grid" style={{ marginBottom: '2rem' }}>
                {recommended.map(ticket => (
                  <div key={ticket.id} className={`ticket-card ${getCategoryClass(ticket.category)}`}>
                    <div className="ticket-header">
                      <span className="ticket-id">Ticket #{ticket.id}</span>
                      <span className="status-badge status-approved">Available</span>
                    </div>
                    <div className="ticket-title">{ticket.title}</div>
                    <div className="ticket-meta">
                      <span>{ticket.category}</span>
                    </div>
                    <div className="ticket-desc">{ticket.description}</div>
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'approved', currentUser.id)}
                      className="btn btn-primary btn-full"
                    >
                      Take Job
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Others */}
            {others.length > 0 && (
              <>
                <hr className="divider" />
                <div className="section-header">
                  <h2 className="section-title">Other Available Tasks</h2>
                  <span className="section-subtitle">{others.length} tasks</span>
                </div>
                <div className="ticket-grid">
                  {others.map(ticket => (
                    <div key={ticket.id} className={`ticket-card ${getCategoryClass(ticket.category)}`} style={{ opacity: 0.85 }}>
                      <div className="ticket-header">
                        <span className="ticket-id">Ticket #{ticket.id}</span>
                        <span className="status-badge status-approved">Available</span>
                      </div>
                      <div className="ticket-title">{ticket.title}</div>
                      <div className="ticket-meta">
                        <span>{ticket.category}</span>
                      </div>
                      <div className="ticket-desc">{ticket.description}</div>
                      <button
                        onClick={() => updateTicketStatus(ticket.id, 'approved', currentUser.id)}
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

        {/* My Jobs Tab */}
        {techTab === 'my-jobs' && (
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
                  <div className="empty-state-desc">Go to "Available" tab to pick up work.</div>
                </div>
              </div>
            ) : (
              <>
                <div className="ticket-grid" style={{ marginBottom: '2rem' }}>
                  {myJobs.map(ticket => (
                    <div key={ticket.id} className={`ticket-card ${getCategoryClass(ticket.category)}`} style={{ borderLeft: '4px solid var(--primary-500)' }}>
                      <div className="ticket-header">
                        <span className="ticket-id">Ticket #{ticket.id}</span>
                        <span className="status-badge status-approved">Working</span>
                      </div>
                      <div className="ticket-title">{ticket.title}</div>
                      <div className="ticket-meta">
                        <span>{ticket.category}</span>
                      </div>
                      <div className="ticket-desc">{ticket.description}</div>
                      <div className="ticket-actions" style={{ flexDirection: 'column' }}>
                        <button
                          onClick={() => handleCompleteJob(ticket)}
                          className="btn btn-success btn-full"
                        >
                          ✓ Mark as Completed
                        </button>
                        <button
                          onClick={() => handleCancelJob(ticket)}
                          className="btn btn-ghost btn-full"
                          style={{ color: 'var(--danger-500)', fontSize: '0.8rem', marginTop: '0.25rem' }}
                        >
                          Request Cancellation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pending Cancellations */}
                {myCancelRequests.length > 0 && (
                  <>
                    <hr className="divider" />
                    <div className="section-header">
                      <h2 className="section-title" style={{ color: 'var(--warning-600)' }}>⏳ Pending Cancellation</h2>
                    </div>
                    <div className="ticket-grid">
                      {myCancelRequests.map(ticket => (
                        <div key={ticket.id} className="ticket-card" style={{ borderLeft: '4px solid var(--warning-500)', opacity: 0.7 }}>
                          <div className="ticket-header">
                            <span className="ticket-id">Ticket #{ticket.id}</span>
                            <span className="status-badge status-cancellation_requested">Awaiting</span>
                          </div>
                          <div className="ticket-title">{ticket.title}</div>
                          <div className="reason-box">
                            <div className="reason-box-label">Your Reason</div>
                            <div className="reason-box-text">{ticket.cancellationReason}</div>
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

        {/* Completed Tab */}
        {techTab === 'completed' && (
          <div>
            <div className="section-header">
              <h2 className="section-title">Completed Jobs</h2>
              <span className="section-subtitle">{myCompleted.length} total</span>
            </div>
            {myCompleted.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <div className="empty-state-title">No completed jobs yet</div>
                  <div className="empty-state-desc">Complete your first job to see it here.</div>
                </div>
              </div>
            ) : (
              <div className="ticket-grid">
                {myCompleted.map(ticket => (
                  <div key={ticket.id} className={`ticket-card ${getCategoryClass(ticket.category)}`} style={{ opacity: 0.9 }}>
                    <div className="ticket-header">
                      <span className="ticket-id">Ticket #{ticket.id}</span>
                      <span className="status-badge status-completed">Completed</span>
                    </div>
                    <div className="ticket-title">{ticket.title}</div>
                    <div className="ticket-meta">
                      <span>{ticket.category}</span>
                      <span className="dot"></span>
                      <span>{ticket.createdAt}</span>
                    </div>
                    <div className="ticket-desc">{ticket.description}</div>
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
