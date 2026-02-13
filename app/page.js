'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMaintenance } from './context/MaintenanceContext';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const { login, currentUser } = useMaintenance();
  const router = useRouter();
  
  const [loginId, setLoginId] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') router.push('/admin');
      else if (currentUser.role === 'tech') router.push('/technician');
      else router.push('/user');
    }
  }, [currentUser, router]);

  const handleLogin = (e) => {
    e.preventDefault();
    const success = login(loginId, loginPwd);
    if (!success) {
      setError('Invalid ID or Password');
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: 'Invalid ID or Password. Please try again.',
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-card animate-in">
          <div className="login-logo">UF</div>
          <h1 className="login-title">UniFix</h1>
          <p className="login-subtitle">University Maintenance Portal</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">User ID</label>
              <input 
                className="form-input"
                type="text" 
                value={loginId} 
                onChange={(e) => setLoginId(e.target.value)} 
                placeholder="Enter your ID"
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                className="form-input"
                type="password" 
                value={loginPwd} 
                onChange={(e) => setLoginPwd(e.target.value)} 
                placeholder="Enter your password"
                required 
              />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn btn-primary btn-full" style={{ padding: '0.75rem' }}>
              Sign In
            </button>
          </form> 
          
          <div className="login-footer">
            <p>Demo Credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
}
