import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const StudentManageResumes = () => {
  const { headers, setStatus } = useAuth();
  const [uploads, setUploads] = useState([]);

  const loadUploads = async () => {
    const data = await apiRequest('/api/profiles/me', { headers });
    setUploads(data.profile?.uploads || []);
  };

  useEffect(() => {
    loadUploads().catch((error) => setStatus(error.message));
  }, []);

  const handleDelete = async (uploadId) => {
    try {
      await apiRequest(`/api/profiles/uploads/${uploadId}`, {
        method: 'DELETE',
        headers,
      });
      await loadUploads();
      setStatus('Resume removed from your profile');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
      <h2 className="font-display text-2xl text-white">Manage Resumes</h2>
      <p className="mt-2 text-sm text-zinc-400">Remove old uploads or download the original PDFs.</p>

      <div className="mt-6 space-y-3">
        {uploads.map((upload) => (
          <div key={upload._id} className="rounded-2xl border border-zinc-800 bg-black p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">{upload.filename}</p>
                <p className="text-xs text-zinc-500">
                  {upload.uploadedAt ? new Date(upload.uploadedAt).toLocaleString() : 'Unknown date'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {upload.resumeUrl ? (
                  <a
                    href={upload.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black"
                  >
                    View PDF
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleDelete(upload._id)}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        {uploads.length === 0 ? (
          <p className="text-sm text-zinc-500">No uploads yet.</p>
        ) : null}
      </div>
    </section>
  );
};

export default StudentManageResumes;
