import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const StudentMatches = () => {
  const { headers, setStatus } = useAuth();
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
      const first = dashboard.profile.uploads?.[0];
      setSelectedUpload(first?.filename || '');
      setHasSelectedResume(true);
      setStatus('Loaded previous resume recommendations');
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleReparseFromProfile = async () => {
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

  const handleApply = async (listingId) => {
    try {
      await apiRequest('/api/applications', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, notes: 'Applied from matches' }),
      });
      await loadData();
      setStatus('Applied successfully');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-white">Matched Internships</h2>
            <p className="mt-2 text-sm text-zinc-400">Pick a previous resume and rank your AI matches.</p>
          </div>
          <Link
            to="/student/resumes"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            Manage resumes
          </Link>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleUsePreviousResume}
            className="w-fit rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black"
          >
            Select previous upload
          </button>

          {data.profile?.uploads?.length ? (
            <>
              <select
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200"
                value={selectedUpload}
                onChange={(event) => setSelectedUpload(event.target.value)}
              >
                <option value="">-- choose previous resume --</option>
                {data.profile.uploads.slice(0, 5).map((upload, idx) => (
                  <option key={`${upload.filename}-${idx}`} value={upload.filename}>
                    {upload.filename} {upload.uploadedAt ? `(${new Date(upload.uploadedAt).toLocaleDateString()})` : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleReparseFromProfile}
                disabled={!selectedUpload}
                className="w-fit rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                Rank matches
              </button>
            </>
          ) : null}
        </div>
      </div>

      {hasSelectedResume ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
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
                  <p className="mt-3 text-xs text-zinc-500">
                    Missing skills: {(item.missingSkills || item.missing_skills || []).join(', ') || 'None'}
                  </p>

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
            {filteredRecommendations.length === 0 ? (
              <p className="text-sm text-zinc-500">No 50%+ matches found for this resume.</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
          <h3 className="font-display text-xl text-white">Top Recommendations</h3>
          <p className="mt-2 text-sm text-zinc-400">Select a resume to view recommendations.</p>
        </div>
      )}
    </section>
  );
};

export default StudentMatches;
