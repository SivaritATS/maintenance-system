'use client';
import { useMaintenance } from '../context/MaintenanceContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { currentUser, logout, users, login } = useMaintenance();
  const router = useRouter();

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    localStorage.removeItem('uid');
    localStorage.removeItem('role');
    localStorage.removeItem('uname');
    router.push('/');
  };

  const handleSwitchUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      login(user.id, user.password); // This sets currentUser

      // Redirect based on role
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'tech') router.push('/technician');
      else router.push('/user');
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (role) => {
    if (role === 'user') return 'User';
    if (role === 'admin') return 'Administrator';
    if (role === 'tech') return 'Technician';
    return role;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">UF</div>
        <div>
          <div className="navbar-title">UniFix</div>
          <div className="navbar-subtitle">Maintenance System</div>
        </div>
      </div>

      <div className="navbar-right">


        {currentUser.score !== undefined && (
          <div className="navbar-score">
            ★ {currentUser.score}
          </div>
        )}

        <div className="navbar-user">
          <div className="navbar-user-info">
            <div className="navbar-user-name">{currentUser.name}</div>
            <div className="navbar-user-role">{getRoleLabel(currentUser.role)}</div>
          </div>
          <div className="navbar-avatar">
            {getInitials(currentUser.name)}
          </div>
        </div>

        <button onClick={handleLogout} className="navbar-btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
}
