'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USERS, INITIAL_TICKETS } from '../mockData';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MaintenanceContext = createContext();
const MySwal = withReactContent(Swal);

export const MaintenanceProvider = ({ children }) => {
  // Global State
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  
  // Debug Mode (can be toggled easily)
  const DEBUG_MODE = true; 

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('maintenance_user_id');
    if (savedUserId) {
      const foundUser = INITIAL_USERS.find(u => u.id === savedUserId);
      if (foundUser) {
        setCurrentUser(foundUser);
      }
    }
  }, []);

  // Save user ID to localStorage when user changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('maintenance_user_id', currentUser.id);
    } else {
      localStorage.removeItem('maintenance_user_id');
    }
  }, [currentUser]);

  // Sync currentUser with the latest data from users array (e.g. score changes)
  useEffect(() => {
    if (currentUser) {
      const latestUser = users.find(u => u.id === currentUser.id);
      if (latestUser && JSON.stringify(latestUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(latestUser);
      }
    }
  }, [users]);


  // Actions
  const login = (id, password) => {
    const foundUser = users.find(u => u.id === id && u.password === password);
    if (foundUser) {
      setCurrentUser(foundUser);
      MySwal.fire({
        icon: 'success',
        title: 'Welcome back!',
        text: `Logged in as ${foundUser.name}`,
        timer: 1500,
        showConfirmButton: false
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('maintenance_user_id');
    MySwal.fire({
      icon: 'info',
      title: 'Logged out',
      timer: 1000,
      showConfirmButton: false
    });
  };

  const createTicket = (ticketData) => {
    const newTicket = {
      id: tickets.length + 1,
      ...ticketData,
      reporterId: currentUser.id,
      status: 'pending',
      assigneeId: null,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTickets([newTicket, ...tickets]);
    MySwal.fire('Submitted!', 'Your report has been sent successfully.', 'success');
  };

  const updateTicketStatus = (ticketId, newStatus, assigneeId = null, reason = null) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { 
          ...t, 
          status: newStatus, 
          assigneeId: assigneeId !== undefined ? assigneeId : t.assigneeId, // Allow null to be passed
          cancellationReason: reason || t.cancellationReason
        };
      }
      return t;
    }));
    
    // Notify
    // Suppress notification for 'cancellation_requested' as it will be handled by the UI
    if (newStatus !== 'cancellation_requested') {
        const action = newStatus === 'approved' ? 'Approved' : 
                       newStatus === 'rejected' ? 'Rejected' : 
                       newStatus === 'completed' ? 'Completed' : 'Updated';
        MySwal.fire('Updated!', `Ticket #${ticketId} marked as ${action}.`, 'success');
    }
  };

  // Helper function to update user score
  const updateUserScore = (userId, pointsChange) => {
    setUsers(currentUsers => {
        return currentUsers.map(u => {
          if (u.id === userId) {
            let newScore = (u.score || 0) + pointsChange;
            if (newScore > 5) newScore = 5;
            if (newScore < 0) newScore = 0;
            return { ...u, score: newScore };
          }
          return u;
        });
        // currentUser sync is handled by the useEffect above
    });
  };

  // Helper for debug switcher
  const switchUser = (role) => {
    const user = users.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Switched to ${role}`,
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  return (
    <MaintenanceContext.Provider value={{ 
      currentUser, 
      setCurrentUser,
      users,
      tickets, 
      login, 
      logout, 
      createTicket, 
      updateTicketStatus,
      updateUserScore,
      DEBUG_MODE,
      switchUser
    }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => useContext(MaintenanceContext);
