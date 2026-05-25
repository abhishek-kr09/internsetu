import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const StudentProfile = () => {
  const { headers, setStatus, setUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    headline: '',
    location: '',
    phone: '',
    bio: '',
    skillsManual: '',
  });

  const loadProfile = async () => {
    const data = await apiRequest('/api/profiles/me', { headers });
    const profile = data.profile || {};
    setForm({
      name: data.user?.name || '',
      headline: profile.headline || '',
      location: profile.location || '',
      phone: profile.phone || '',
      bio: profile.bio || '',
      skillsManual: Array.isArray(profile.skillsManual) ? profile.skillsManual.join(', ') : '',
    });
  };

  useEffect(() => {
    loadProfile().catch((error) => setStatus(error.message));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await apiRequest('/api/profiles/me', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          headline: form.headline,
          location: form.location,
          phone: form.phone,
          bio: form.bio,
          skillsManual: form.skillsManual,
        }),
      });
      setUser((prev) => (prev ? { ...prev, name: form.name } : prev));
      setStatus('Profile updated');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
      <h2 className="font-display text-2xl text-white">Profile Editing</h2>
      <p className="mt-2 text-sm text-zinc-400">Update your personal details and skills anytime.</p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          placeholder="Full name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          className="rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm text-zinc-200 outline-none ring-cyan-400/70 focus:ring"
        />
        <input
          placeholder="Headline (e.g., Frontend Intern)"
          value={form.headline}
          onChange={(event) => setForm((prev) => ({ ...prev, headline: event.target.value }))}
          className="rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm text-zinc-200 outline-none ring-cyan-400/70 focus:ring"
        />
        <input
          placeholder="Location"
          value={form.location}
          onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
          className="rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm text-zinc-200 outline-none ring-cyan-400/70 focus:ring"
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          className="rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm text-zinc-200 outline-none ring-cyan-400/70 focus:ring"
        />
        <input
          placeholder="Skills (comma separated)"
          value={form.skillsManual}
          onChange={(event) => setForm((prev) => ({ ...prev, skillsManual: event.target.value }))}
          className="md:col-span-2 rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm text-zinc-200 outline-none ring-cyan-400/70 focus:ring"
        />
        <textarea
          placeholder="Short bio"
          rows={4}
          value={form.bio}
          onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
          className="md:col-span-2 rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm text-zinc-200 outline-none ring-cyan-400/70 focus:ring"
        />
        <button className="md:col-span-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black">
          Save Profile
        </button>
      </form>
    </section>
  );
};

export default StudentProfile;
