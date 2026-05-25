import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const StudentLayout = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Explore Internships', to: '/student/explore' },
    { label: 'Upload Resume', to: '/student/upload' },
    { label: 'Manage Resumes', to: '/student/resumes' },
    { label: 'Matched Internships', to: '/student/matches' },
    { label: 'Profile Editing', to: '/student/profile' },
    { label: 'Notifications', to: '/student/notifications' },
  ];

  return (
    <div className="relative flex min-h-[70vh] gap-6">
      <button
        type="button"
        className="absolute left-0 top-0 z-40 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 md:hidden"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700">
          <span className="block h-1 w-3 bg-zinc-200"></span>
        </span>
        Menu
      </button>

      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/70 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-24 z-40 h-[calc(100vh-6rem)] w-64 rounded-r-2xl border border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur-md transition-transform md:static md:h-auto md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Student Workspace</p>
        <nav className="mt-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `block rounded-xl border px-3 py-2 text-sm transition ${
                isActive
                  ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200'
                  : 'border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
              }`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 md:pl-2">
        <Outlet />
      </div>
    </div>
  );
};

export default StudentLayout;
