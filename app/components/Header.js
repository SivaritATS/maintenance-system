'use client';
import { useMaintenance } from '../context/MaintenanceContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Header() {
  const { currentUser, logout } = useMaintenance();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Always prefer URL param; fallback to localStorage if URL param missing
  const urlId = searchParams.get('id');
  const storedId = typeof window !== 'undefined' ? localStorage.getItem('eid') : null;
  const currentId = urlId || storedId;

  // Keep localStorage in sync with URL
  if (typeof window !== 'undefined' && urlId && urlId !== storedId) {
    localStorage.setItem('eid', urlId);
  }

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    localStorage.removeItem('uid');
    localStorage.removeItem('role');
    localStorage.removeItem('uname');
    localStorage.removeItem('eid');
    router.push('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (role) => {
    if (role === 'user') return 'User';
    if (role === 'admin') return 'Administrator';
    if (role === 'tech') return 'Technician';
    return role;
  };

  const getDashboardPath = () => {
    const base = currentUser.role === 'tech' ? '/technician' : `/${currentUser.role}`;
    return currentId ? `${base}?id=${currentId}` : base;
  };

  const closDrawer = () => {
    const el = document.getElementById('my-drawer');
    if (el) el.checked = false;
  };

  return (
    <>
      {/* Top Navbar */}
      <div className="navbar bg-base-100 shadow-md sticky top-0 z-50">
        <div className="flex-none">
          <label htmlFor="my-drawer" className="btn btn-square btn-ghost drawer-button">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-lg">
            UF
          </div>
          <div className="hidden sm:block">
            <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">UniFix</div>
            <div className="text-xs uppercase tracking-widest text-base-content/60 font-semibold">Maintenance</div>
          </div>
        </div>

        <div className="flex-none gap-3">
          {currentUser.score !== undefined && (
            <div className="badge badge-warning gap-1 font-bold p-3 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
              {currentUser.score}
            </div>
          )}

          <div className="flex items-center gap-2 pr-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold border border-primary/20">
              {getInitials(currentUser.name)}
            </div>
            <div className="hidden sm:block text-sm">
              <div className="font-semibold text-base-content leading-tight">{currentUser.name}</div>
              <div className="text-xs text-base-content/60">{getRoleLabel(currentUser.role)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Sidebar */}
      <div className="drawer z-[100] fixed top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 9999 }}>
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-side w-full h-full pointer-events-none">
          <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay pointer-events-auto"></label>
          <ul className="menu p-4 w-72 min-h-full bg-base-100 text-base-content pointer-events-auto flex flex-col gap-1 shadow-2xl">

            {/* Profile Header */}
            <li className="mb-4">
              <div className="flex items-center gap-4 py-4 border-b border-base-200 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border border-primary/20">
                  {getInitials(currentUser.name)}
                </div>
                <div>
                  <div className="font-bold text-base">{currentUser.name}</div>
                  <div className="text-sm opacity-60 badge badge-outline badge-sm mt-1">{getRoleLabel(currentUser.role)}</div>
                </div>
              </div>
            </li>

            {/* Dashboard Link — Admin only → goes straight to Tech Stats */}
            {currentUser.role === 'admin' && (
              <li>
                <a
                  onClick={() => {
                    closDrawer();
                    router.push(`/admin?id=${currentId}&tab=performance`);
                  }}
                  className="py-3 font-medium cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Dashboard
                </a>
              </li>
            )}

            <div className="divider my-1"></div>

            {/* Logout */}
            <li>
              <a onClick={handleLogout} className="py-3 text-error font-medium cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
