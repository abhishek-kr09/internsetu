import { NavLink } from 'react-router-dom';

const StudentSidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { label: 'Explore Internships', to: '/student/explore' },
    { label: 'Matched Internships', to: '/student/matches' },
    { label: 'Resumes', to: '/student/resumes' },
    { label: 'Applied Internships', to: '/student/applications' },
    { label: 'Profile Editing', to: '/student/profile' },
  ];

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-24 z-40 h-[calc(100vh-6rem)] w-64 rounded-r-2xl border border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur-md transition-all duration-300 lg:static lg:h-auto ${
          isOpen
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full opacity-0 pointer-events-none lg:translate-x-0 lg:opacity-0 lg:w-0 lg:border-transparent lg:p-0'
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Student Workspace</p>
        <nav className="mt-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
    </>
  );
};

export default StudentSidebar;
