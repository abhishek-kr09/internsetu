import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
  const { headers, setStatus } = useAuth();
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeSource, setResumeSource] = useState('previous');
  const [hasSelectedResume, setHasSelectedResume] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState('');
  const [data, setData] = useState({ profile: null, recommendations: [], applications: [] });

  const loadData = async () => {
    const dashboard = await apiRequest('/api/dashboard/student', { headers });

    setData({
      profile: dashboard.profile || null,
      recommendations: dashboard.recommendations || [],
      applications: dashboard.applications || [],
    });

    return dashboard;
  };

  useEffect(() => {
    loadData().catch((error) => setStatus(error.message));
  }, []);

  const appliedMap = useMemo(
    () => new Set(data.applications.map((item) => item.listing?._id || item.listing)),
    [data.applications]
  );

  const filteredRecommendations = useMemo(
    () => data.recommendations.filter((item) => (item.matchScore ?? item.match_score ?? 0) >= 50),
    [data.recommendations]
  );

  const handleUsePreviousResume = async () => {
    try {
      const dashboard = await loadData();
      if (!dashboard.profile?.resumeText) {
        setStatus('No previous uploaded resume found. Please upload a new resume.');
        return;
      }
      // if there are uploads, preselect the latest
      const first = dashboard.profile.uploads?.[0];
      setSelectedUpload(first?.filename || '');
      setHasSelectedResume(true);
      setStatus('Loaded previous resume recommendations');
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleReparseFromProfile = async (event) => {
    event?.preventDefault?.();
    if (!selectedUpload) {
      setStatus('Select a previous resume from the dropdown');
      return;
    }

    try {
      await apiRequest('/api/profiles/reparse', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedUpload }),
      });
      await loadData();
      setHasSelectedResume(true);
      setStatus('Reparsed selected resume and refreshed recommendations');
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleResumeUpload = async (event) => {
    event.preventDefault();
    if (!resumeFile) {
      setStatus('Select a PDF file before upload');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      await apiRequest('/api/profiles/resume-upload', {
        method: 'POST',
        headers,
        body: formData,
      });
      await loadData();
      setHasSelectedResume(true);
      setStatus('Resume parsed and recommendations refreshed');
      setResumeFile(null);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleApply = async (listingId) => {
    try {
      await apiRequest('/api/applications', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, notes: 'Applied from dashboard' }),
      });
      await loadData();
      setStatus('Applied successfully');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section className="space-y-7">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <form onSubmit={handleResumeUpload} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h3 className="font-display text-xl text-white">Resume Parser + AI Recommendations</h3>
          <p className="mt-2 text-sm text-zinc-400">Choose previous resume or upload a new PDF. Only 50%+ matches are shown.</p>

          <div className="mt-5 flex gap-2 rounded-xl border border-zinc-800 bg-black p-1">
            <button
              type="button"
              onClick={() => setResumeSource('previous')}
              className={`w-full rounded-lg bg-white px-3 py-2 text-sm text-black ${
                resumeSource === 'previous' ? '' : 'opacity-70'
              }`}
            >
              Use previous resume
            </button>
            <button
              type="button"
              onClick={() => setResumeSource('upload')}
              className={`w-full rounded-lg bg-white px-3 py-2 text-sm text-black ${
                resumeSource === 'upload' ? '' : 'opacity-70'
              }`}
            >
              Upload new resume
            </button>
          </div>

          {resumeSource === 'previous' ? (
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleUsePreviousResume}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black"
              >
                Select previous upload
              </button>

              {data.profile?.uploads?.length ? (
                <>
                  <select
                    className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200"
                    value={selectedUpload}
                    onChange={(e) => setSelectedUpload(e.target.value)}
                  >
                    <option value="">-- choose previous resume --</option>
                    {data.profile.uploads.slice(0, 5).map((u, idx) => (
                      <option key={`${u.filename}-${idx}`} value={u.filename}>
                        {u.filename} {u.uploadedAt ? `(${new Date(u.uploadedAt).toLocaleDateString()})` : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleReparseFromProfile}
                    className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black"
                  >
                    Parse & Rank
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <>
              <input
                type="file"
                accept=".pdf"
                className="mt-5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm text-black"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
              />
              <button className="mt-4 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black">
                Parse & Rank
              </button>
            </>
          )}
        </form>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h3 className="font-display text-xl text-white">My Applications</h3>
          <p className="mt-2 text-sm text-zinc-400">{data.applications.length} internships tracked</p>
          <div className="mt-4 max-h-60 space-y-3 overflow-auto pr-2">
            {data.applications.map((item) => (
              <div key={item._id} className="rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-100">{item.listing?.title || 'Untitled internship'}</p>
                    <p className="text-xs text-zinc-400">{item.listing?.company || 'Unknown company'}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase ${
                    item.status === 'accepted'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : item.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {item.status || 'pending'}
                  </span>
                </div>
              </div>
            ))}
            {data.applications.length === 0 ? <p className="text-sm text-zinc-500">No applications yet.</p> : null}
          </div>
        </div>
      </div>

      {hasSelectedResume ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h3 className="font-display text-xl text-white">Top Recommendations (50%+ Match)</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredRecommendations.map((item, index) => {
            const recommendationListingId = item.listing || item.listingId;
            const alreadyApplied = recommendationListingId ? appliedMap.has(recommendationListingId) : false;

            return (
              <article key={`${item.title}-${index}`} className="rounded-xl border border-zinc-800 bg-black p-4">
              <p className="text-xs text-zinc-500">Match score</p>
              <p className="text-3xl font-bold text-cyan-300">{item.matchScore ?? item.match_score}%</p>
              <h4 className="mt-2 text-lg font-medium text-white">{item.title}</h4>
              <p className="text-sm text-zinc-400">{item.company}</p>
              <p className="mt-3 text-xs text-zinc-500">Missing skills: {(item.missingSkills || item.missing_skills || []).join(', ') || 'None'}</p>

              <button
                onClick={() => handleApply(recommendationListingId)}
                disabled={!recommendationListingId || alreadyApplied}
                className="mt-4 rounded-lg bg-white px-4 py-2 text-sm text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {alreadyApplied ? 'Applied' : 'Apply'}
              </button>
              </article>
              );
            })}
            {filteredRecommendations.length === 0 ? <p className="text-sm text-zinc-500">No 50%+ matches found for this resume.</p> : null}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h3 className="font-display text-xl text-white">Top Recommendations</h3>
          <p className="mt-2 text-sm text-zinc-400">Select previous resume or upload a new one to view recommendations.</p>
        </div>
      )}
    </section>
  );
};

export default StudentDashboard;
