'use client';
import { useMaintenance } from '../context/MaintenanceContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const { currentUser, logout } = useMaintenance();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(true);

  // Always prefer URL param; fallback to localStorage if URL param missing
  const urlId = searchParams.get('id');
  const storedId = typeof window !== 'undefined' ? localStorage.getItem('eid') : null;
  const currentId = urlId || storedId;

  // Keep localStorage in sync with URL
  if (typeof window !== 'undefined' && urlId && urlId !== storedId) {
    localStorage.setItem('eid', urlId);
  }

  useEffect(() => {
    // Initial state based on screen size
    if (typeof window !== 'undefined') {
      setIsOpen(window.innerWidth >= 1024);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isOpen && currentUser) {
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
      }
    }
  }, [isOpen, currentUser]);

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

  const getRoleLabel = (role, category) => {
    if (role === 'user') return 'User';
    if (role === 'admin') return 'Administrator';
    if (role === 'tech') return category ? `Technician (${category})` : 'Technician';
    return role;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --sidebar-width: 288px;
        }
        body.sidebar-open {
          padding-left: var(--sidebar-width);
          transition: padding-left 0.3s ease;
        }
        @media (max-width: 1023px) {
          body.sidebar-open {
            padding-left: 0;
          }
        }
        .sidebar-transition {
          transition: transform 0.3s ease, width 0.3s ease;
        }
      `}} />

      {/* Top Navbar */}
      <div 
        className={`navbar shadow-sm fixed top-0 right-0 z-[60] transition-all duration-300
          ${isOpen ? 'lg:left-72 lg:w-[calc(100%-288px)]' : 'left-0 w-full'}
        `}
        style={{ backgroundColor: 'oklch(var(--b1))' }}
      >
        <div className="flex-none">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="btn btn-square btn-ghost"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex items-center gap-2 ml-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-lg">
            UF
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary leading-tight">UniFix</div>
            <div className="text-[10px] uppercase tracking-widest text-base-content/60 font-semibold leading-tight">Maintenance</div>
          </div>
        </div>

        <div className="flex-none gap-3">
          {currentUser.score !== undefined && (
            <div className="badge badge-warning gap-1 font-bold p-3 shadow-sm mr-2">
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
              <div className="text-xs text-base-content/60">{getRoleLabel(currentUser.role, currentUser.category)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full bg-base-100 shadow-2xl border-r border-[#d1d5db] z-[55] sidebar-transition overflow-hidden
          ${isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full pt-16"> {/* pt-16 to avoid overlapping with navbar */}
          <ul className="menu p-4 w-72 text-base-content flex flex-col gap-1">
            {/* Profile Header */}
            <li className="mb-4">
              <div className="flex items-center gap-4 py-4 border-b border-base-200 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border border-primary/20">
                  {getInitials(currentUser.name)}
                </div>
                <div>
                  <div className="font-bold text-base">{currentUser.name}</div>
                  <div className="text-[11px] font-semibold opacity-70 mt-1 uppercase tracking-wider">{getRoleLabel(currentUser.role, currentUser.category)}</div>
                </div>
              </div>
            </li>

            {/* Role specific links */}
            {currentUser.role === 'admin' && (
              <>
                <li>
                  <Link href={`/admin?id=${currentId}`} className="py-3 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Admin Home
                  </Link>
                </li>
                <li>
                  <Link href={`/admin/dashboard?id=${currentId}`} className="py-3 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard (Tech Status)
                  </Link>
                </li>
              </>
            )}

            {currentUser.role === 'user' && (
              <li>
                <Link href={`/user?id=${currentId}`} className="py-3 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  My Reports
                </Link>
              </li>
            )}

            {currentUser.role === 'tech' && (
              <li>
                <Link href={`/technician?id=${currentId}`} className="py-3 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Job Board
                </Link>
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

      {/* Overlay for mobile only */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[50] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

