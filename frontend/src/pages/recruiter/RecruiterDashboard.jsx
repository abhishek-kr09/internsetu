import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { initialListing } from '../../utils/constants';

const RecruiterDashboard = () => {
  const { headers, setStatus } = useAuth();
  const [listingForm, setListingForm] = useState(initialListing);
  const [data, setData] = useState({ listings: [], stats: null, applications: [] });

  const loadData = async () => {
    const [dashboard, listings] = await Promise.all([
      apiRequest('/api/dashboard/recruiter', { headers }),
      apiRequest('/api/listings', { headers }),
    ]);

    let applications = [];
    try {
      const applicationsRes = await apiRequest('/api/applications/recruiter', { headers });
      applications = applicationsRes.applications || [];
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }

    setData({
      stats: dashboard.stats || null,
      listings: listings.listings || [],
      applications,
    });
  };

  useEffect(() => {
    loadData().catch((error) => setStatus(error.message));
  }, []);

  const handleCreateListing = async (event) => {
    event.preventDefault();
    try {
      await apiRequest('/api/listings', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...listingForm,
          skills: listingForm.skills,
          durationWeeks: Number(listingForm.durationWeeks),
        }),
      });

      setListingForm(initialListing);
      await loadData();
      setStatus('Internship listing posted');
    } catch (error) {
      setStatus(error.message);
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await apiRequest(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await loadData();
      setStatus(`Application ${status}`);
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={handleCreateListing} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <h3 className="font-display text-xl text-white">Add Internship</h3>
        <p className="mt-2 text-sm text-zinc-400">Fill the form and publish internship listing instantly.</p>

        <div className="mt-4 grid gap-3">
          {[
            { key: 'title', label: 'Title' },
            { key: 'company', label: 'Company' },
            { key: 'location', label: 'Location' },
            { key: 'stipend', label: 'Stipend' },
          ].map((field) => (
            <input
              key={field.key}
              placeholder={field.label}
              value={listingForm[field.key]}
              onChange={(event) => setListingForm({ ...listingForm, [field.key]: event.target.value })}
              className="rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm outline-none ring-cyan-400/70 focus:ring"
              required={field.key === 'title' || field.key === 'company'}
            />
          ))}

          <input
            type="number"
            min="1"
            placeholder="Duration weeks"
            value={listingForm.durationWeeks}
            onChange={(event) => setListingForm({ ...listingForm, durationWeeks: event.target.value })}
            className="rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm outline-none ring-cyan-400/70 focus:ring"
          />

          <select
            value={listingForm.mode}
            onChange={(event) => setListingForm({ ...listingForm, mode: event.target.value })}
            className="rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm outline-none ring-cyan-400/70 focus:ring"
          >
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>

          <input
            placeholder="Skills (comma separated)"
            value={listingForm.skills}
            onChange={(event) => setListingForm({ ...listingForm, skills: event.target.value })}
            className="rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm outline-none ring-cyan-400/70 focus:ring"
            required
          />

          <textarea
            placeholder="Description"
            rows={4}
            value={listingForm.description}
            onChange={(event) => setListingForm({ ...listingForm, description: event.target.value })}
            className="rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm outline-none ring-cyan-400/70 focus:ring"
            required
          />

          <button className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black">
            Publish Listing
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h3 className="font-display text-xl text-white">Recruiter Dashboard</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-zinc-800 bg-black p-4">
              <p className="text-zinc-500">Total listings</p>
              <p className="mt-1 text-2xl font-bold text-white">{data.stats?.totalListings ?? 0}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-black p-4">
              <p className="text-zinc-500">Total applications</p>
              <p className="mt-1 text-2xl font-bold text-cyan-300">{data.stats?.totalApplications ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h3 className="font-display text-xl text-white">Posted Internships</h3>
          <div className="mt-4 max-h-[470px] space-y-3 overflow-auto pr-1">
            {data.listings.map((listing) => (
              <article key={listing._id} className="rounded-xl border border-zinc-800 bg-black p-4">
                <h4 className="font-medium text-white">{listing.title}</h4>
                <p className="text-sm text-zinc-400">{listing.company} • {listing.mode}</p>
                <p className="text-xs text-zinc-500">{listing.skills.join(', ')}</p>
              </article>
            ))}
            {data.listings.length === 0 ? <p className="text-sm text-zinc-500">No listings posted yet.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h3 className="font-display text-xl text-white">Application Requests</h3>
          <div className="mt-4 max-h-[420px] space-y-3 overflow-auto pr-1">
            {data.applications.map((application) => (
              <article key={application._id} className="rounded-xl border border-zinc-800 bg-black p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-white">{application.listing?.title}</h4>
                    <p className="text-sm text-zinc-400">{application.student?.name} • {application.student?.email}</p>
                    {application.student?.resumeUrl ? (
                      <a
                        href={application.student.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs font-semibold text-cyan-400 underline decoration-cyan-400/30 hover:text-cyan-300"
                      >
                        View Original Resume (PDF)
                      </a>
                    ) : (
                      <p className="mt-1 text-[10px] italic text-zinc-600">No original PDF available</p>
                    )}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase ${
                    application.status === 'accepted'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : application.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {application.status || 'pending'}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => updateApplicationStatus(application._id, 'accepted')}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(application._id, 'rejected')}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}

            {data.applications.length === 0 ? (
              <p className="text-sm text-zinc-500">No application requests yet.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecruiterDashboard;
