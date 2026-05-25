import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const StudentApplications = () => {
  const { headers, setStatus } = useAuth();
  const [applications, setApplications] = useState([]);

  const loadApplications = async () => {
    const data = await apiRequest('/api/applications/me', { headers });
    setApplications(data.applications || []);
  };

  useEffect(() => {
    loadApplications().catch((error) => setStatus(error.message));
  }, []);

  const handleWithdraw = async (applicationId) => {
    try {
      await apiRequest(`/api/applications/${applicationId}`, {
        method: 'DELETE',
        headers,
      });
      await loadApplications();
      setStatus('Application withdrawn');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
      <h2 className="font-display text-2xl text-white">Applied Internships</h2>
      <p className="mt-2 text-sm text-zinc-400">Track your applications and withdraw if needed.</p>

      <div className="mt-6 space-y-3">
        {applications.map((application) => (
          <article key={application._id} className="rounded-2xl border border-zinc-800 bg-black p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  to={application.listing?._id ? `/internships/${application.listing._id}` : '#'}
                  className="text-sm font-semibold text-white hover:text-cyan-300"
                >
                  {application.listing?.title || 'Untitled'}
                </Link>
                <p className="text-xs text-zinc-400">{application.listing?.company || 'Unknown'} • {application.listing?.location || 'Remote'} • {application.listing?.mode || 'remote'}</p>
                <p className="text-[11px] text-zinc-500">Stipend: {application.listing?.stipend || 'Unpaid'} • Applied {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase ${
                  application.status === 'accepted'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : application.status === 'rejected'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {application.status || 'pending'}
                </span>
                <button
                  type="button"
                  onClick={() => handleWithdraw(application._id)}
                  disabled={application.status === 'accepted'}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </article>
        ))}

        {applications.length === 0 ? (
          <p className="text-sm text-zinc-500">No applications yet.</p>
        ) : null}
      </div>
    </section>
  );
};

export default StudentApplications;
