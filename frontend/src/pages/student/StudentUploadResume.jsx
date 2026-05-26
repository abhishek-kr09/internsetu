import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const StudentUploadResume = () => {
  const { headers, setStatus } = useAuth();
  const [resumeFile, setResumeFile] = useState(null);
  const [profile, setProfile] = useState(null);

  const loadProfile = async () => {
    const data = await apiRequest('/api/profiles/me', { headers });
    setProfile(data.profile || null);
  };

  useEffect(() => {
    loadProfile().catch((error) => setStatus(error.message));
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
      await loadProfile();
      setStatus('Resume uploaded and parsed');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
      <h2 className="font-display text-2xl text-white">Upload a New Resume</h2>
      <p className="mt-2 text-sm text-zinc-400">Upload a PDF to parse it and update your resume library.</p>

      <form onSubmit={handleResumeUpload} className="mt-6 space-y-4">
        <input
          type="file"
          accept=".pdf"
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm text-black"
          onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
        />
        <button className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black">
          Upload & Parse
        </button>
      </form>

      {profile?.uploads?.length ? (
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-black p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Recent Uploads</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-200">
            {profile.uploads.slice(0, 3).map((upload) => (
              <li key={upload._id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                <span>{upload.filename}</span>
                {upload.resumeUrl ? (
                  <a
                    href={upload.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-cyan-300"
                  >
                    View PDF
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};

export default StudentUploadResume;
