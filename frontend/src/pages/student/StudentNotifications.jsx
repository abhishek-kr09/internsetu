const StudentNotifications = () => {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-black text-zinc-200">
          <svg
            width="18"
            height="18"
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
        </span>
        <div>
          <h2 className="font-display text-2xl text-white">Notifications</h2>
          <p className="text-sm text-zinc-400">Socket.io alerts will appear here soon.</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 bg-black/60 p-6 text-sm text-zinc-500">
        No notifications yet.
      </div>
    </section>
  );
};

export default StudentNotifications;
