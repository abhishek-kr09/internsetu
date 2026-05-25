import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onMenuClick, isMenuOpen }) => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const initials = user?.name?.trim()?.[0]?.toUpperCase() || 'U';
  const profileRef = useRef(null);

  useEffect(() => {
    if (!isProfileOpen) return;

    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isProfileOpen]);

  return (
    <header>
      <nav className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          {isStudent ? (
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 hover:text-white"
              aria-label="Toggle sidebar"
              aria-expanded={isMenuOpen ? 'true' : 'false'}
            >
              <span className="flex flex-col gap-1">
                <span className="block h-0.5 w-4 rounded-full bg-current"></span>
                <span className="block h-0.5 w-4 rounded-full bg-current"></span>
                <span className="block h-0.5 w-4 rounded-full bg-current"></span>
              </span>
            </button>
          ) : null}
          <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-700 bg-zinc-900">
            <span className="font-display text-sm font-bold tracking-tight text-zinc-100">IS</span>
          </div>
          <span className="hidden text-sm font-medium text-zinc-300 sm:block">Internsetu</span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {user ? (
            <>
              {user.role === 'student' ? (
                <Link
                  to="/student/notifications"
                  className="group rounded-full border border-zinc-800 bg-black px-3 py-1.5 text-sm text-zinc-300 transition hover:text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    Alerts
                  </span>
                </Link>
              ) : null}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-black"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen ? 'true' : 'false'}
                >
                  {initials}
                </button>
                {isProfileOpen ? (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-lg">
                    <div className="px-3 py-2 text-xs text-zinc-400">Signed in as</div>
                    <div className="px-3 pb-2 text-sm font-medium text-white">{user?.name || 'User'}</div>
                    <Link
                      to="/logout"
                      onClick={() => setIsProfileOpen(false)}
                      className="block rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black"
                    >
                      Logout
                    </Link>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-zinc-300 transition hover:text-white">
                Log in
              </Link>
              <Link to="/register" className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-black">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
