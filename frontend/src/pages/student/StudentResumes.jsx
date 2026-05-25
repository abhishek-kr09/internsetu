import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const StudentResumes = () => {
  const { headers, setStatus } = useAuth();
  const [resumeFile, setResumeFile] = useState(null);
  const [uploads, setUploads] = useState([]);

  const loadUploads = async () => {
    const data = await apiRequest('/api/profiles/me', { headers });
    setUploads(data.profile?.uploads || []);
  };

  useEffect(() => {
    loadUploads().catch((error) => setStatus(error.message));
  }, []);

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
      setResumeFile(null);
      await loadUploads();
      setStatus('Resume uploaded and parsed');
    } catch (error) {
      setStatus(error.message);
    }
  };

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
      <h2 className="font-display text-2xl text-white">Resumes</h2>
      <p className="mt-2 text-sm text-zinc-400">Upload a PDF and manage your previous resumes.</p>

      <form onSubmit={handleResumeUpload} className="mt-6 space-y-4">
        <input
          type="file"
          accept=".pdf"
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm text-black"
          onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
        />
        <button className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black">
          Parse & Rank
        </button>
      </form>

      <div className="mt-8 space-y-3">
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

export default StudentResumes;
