import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register, setStatus } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = await register(form);
      navigate(data.user.role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/student');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
      <h2 className="font-display text-3xl text-white">Create account</h2>
      <p className="mt-2 text-sm text-zinc-400">Choose your role and start using InternSetu.</p>
      <form onSubmit={handleSubmit} className="mt-6">
        <input
          className="mb-4 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none ring-cyan-400/70 focus:ring"
          placeholder="Full name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
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
        <select
          className="mb-4 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none ring-cyan-400/70 focus:ring"
          value={form.role}
          onChange={(event) => setForm({ ...form, role: event.target.value })}
        >
          <option value="student">Student</option>
          <option value="recruiter">Recruiter</option>
        </select>
        <button className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black">
          Create account
        </button>
      </form>
      <p className="mt-5 text-sm text-zinc-400">
        Already registered? <Link to="/login" className="text-zinc-200 underline">Log in</Link>
      </p>
    </section>
  );
};

export default Register;
