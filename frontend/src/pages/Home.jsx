import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-8 sm:p-12">
      <div className="absolute -left-16 top-6 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl"></div>
      <div className="absolute -right-20 bottom-2 h-60 w-60 rounded-full bg-zinc-300/10 blur-3xl"></div>
      <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">Internsetu • AI Matching</p>
      <h2 className="font-display mt-4 max-w-4xl text-4xl leading-tight text-white sm:text-6xl">
        The AI internship engine for students and recruiters.
      </h2>
      <p className="mt-5 max-w-2xl text-zinc-300">
        Parse resumes, score internship fit with Gemini, and show ranked opportunities with skill gap analysis.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {user ? (
          <Link
            to="/internships"
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black"
          >
            Explore internships
          </Link>
        ) : (
          <>
            <Link to="/register" className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black">
              Sign up
            </Link>
            <Link to="/login" className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black">
              Log in
            </Link>
          </>
        )}
      </div>
    </section>
  );
};

export default Home;
