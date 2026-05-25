import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, setStatus } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = await login(form);
      navigate(data.user.role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/student');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
      <h2 className="font-display text-3xl text-white">Log in</h2>
      <p className="mt-2 text-sm text-zinc-400">Continue to your student or recruiter dashboard.</p>
      <form onSubmit={handleSubmit} className="mt-6">
        <input
          className="mb-4 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none ring-cyan-400/70 focus:ring"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        <input
          className="mb-4 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none ring-cyan-400/70 focus:ring"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />
        <button className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black">
          Enter dashboard
        </button>
      </form>
      <p className="mt-5 text-sm text-zinc-400">
        New here? <Link to="/register" className="text-zinc-200 underline">Create account</Link>
      </p>
    </section>
  );
};

export default Login;
