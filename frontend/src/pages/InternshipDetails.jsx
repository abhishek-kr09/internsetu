import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

const InternshipDetails = () => {
  const { listingId } = useParams();
  const { user, setStatus, headers } = useAuth();
  const [listing, setListing] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [selectedUploadId, setSelectedUploadId] = useState('');
  const [showResumePicker, setShowResumePicker] = useState(false);

  useEffect(() => {
    const loadListing = async () => {
      try {
        const data = await apiRequest(`/api/listings/${listingId}`);
        setListing(data.listing || null);
      } catch (error) {
        if (error.status === 404 && user) {
          try {
            const privateListing = await apiRequest(`/api/listings/${listingId}`, { headers });
            setListing(privateListing.listing || null);
            return;
          } catch (fallbackError) {
            setStatus(fallbackError.message);
            return;
          }
        }
        setStatus(error.message);
      }
    };

    loadListing();
  }, [listingId, user]);

  useEffect(() => {
    const checkApplied = async () => {
      if (!user || user.role !== 'student') return;

      try {
        const data = await apiRequest('/api/applications/me', { headers });
        const appliedSet = new Set(
          (data.applications || []).map((item) => item.listing?._id || item.listing)
        );
        setHasApplied(appliedSet.has(listingId));
      } catch (error) {
        setStatus(error.message);
      }
    };

    checkApplied();
  }, [listingId, user, headers, setStatus]);

  useEffect(() => {
    const loadUploads = async () => {
      if (!user || user.role !== 'student') return;

      try {
        const data = await apiRequest('/api/profiles/me', { headers });
        setUploads(data.profile?.uploads || []);
      } catch (error) {
        setStatus(error.message);
      }
    };

    loadUploads();
  }, [user, headers, setStatus]);

  const handleApply = async () => {
    if (!listingId || hasApplied || isSubmitting || !selectedUploadId) return;

    const selectedUpload = uploads.find((upload) => upload._id === selectedUploadId);
    const notes = selectedUpload
      ? `Applied with resume: ${selectedUpload.filename}`
      : 'Applied from details';

    try {
      setIsSubmitting(true);
      await apiRequest('/api/applications', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, notes }),
      });
      setHasApplied(true);
      setShowResumePicker(false);
      setSelectedUploadId('');
      setStatus('Application submitted');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!listing) {
    return (
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
        <p className="text-sm text-zinc-400">Loading internship details...</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-white">{listing.title}</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {listing.company} • {listing.location} • {listing.mode}
          </p>
        </div>
        {user?.role === 'student' ? (
          <div className="flex flex-col items-start gap-3">
            {!showResumePicker ? (
              <button
                type="button"
                onClick={() => setShowResumePicker(true)}
                disabled={hasApplied}
                className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {hasApplied ? 'Applied' : 'Apply now'}
              </button>
            ) : null}

            {showResumePicker ? (
              <div className="flex flex-wrap items-center gap-3">
                {uploads.length ? (
                  <select
                    value={selectedUploadId}
                    onChange={(event) => setSelectedUploadId(event.target.value)}
                    className="rounded-full border border-zinc-700 bg-black px-4 py-2 text-sm text-zinc-200"
                  >
                    <option value="">Select resume</option>
                    {uploads.map((upload) => (
                      <option key={upload._id} value={upload._id}>
                        {upload.filename}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-zinc-400">
                    Upload a resume to apply.{' '}
                    <Link to="/student/resumes" className="text-zinc-200 underline">
                      Upload now
                    </Link>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={hasApplied || isSubmitting || !selectedUploadId}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {hasApplied ? 'Applied' : isSubmitting ? 'Submitting...' : 'Submit application'}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <Link
            to="/login"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            Login to apply
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Stipend</p>
          <p className="mt-2 text-lg text-zinc-100">{listing.stipend || 'Unpaid'}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Duration</p>
          <p className="mt-2 text-lg text-zinc-100">{listing.durationWeeks} weeks</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Mode</p>
          <p className="mt-2 text-lg text-zinc-100">{listing.mode}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Description</p>
        <p className="mt-3 text-sm text-zinc-200 leading-relaxed">{listing.description}</p>
      </div>

      {listing.skills?.length ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Skills</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {listing.skills.map((skill) => (
              <span key={skill} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200">
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default InternshipDetails;
