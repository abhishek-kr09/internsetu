import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

const Internships = () => {
  const { user, setStatus, headers } = useAuth();
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({
    location: '',
    minStipend: '',
    maxStipend: '',
    durationWeeks: '',
  });

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  };

  const filteredListings = useMemo(() => {
    const locationQuery = filters.location.trim().toLowerCase();
    const minStipend = parseNumber(filters.minStipend);
    const maxStipend = parseNumber(filters.maxStipend);
    const durationWeeks = parseNumber(filters.durationWeeks);

    return listings.filter((listing) => {
      const listingLocation = (listing.location || '').toLowerCase();
      if (locationQuery && !listingLocation.includes(locationQuery)) {
        return false;
      }

      const listingStipend = parseNumber(listing.stipend);
      if (minStipend !== null && (listingStipend === null || listingStipend < minStipend)) {
        return false;
      }
      if (maxStipend !== null && (listingStipend === null || listingStipend > maxStipend)) {
        return false;
      }

      const listingDuration = parseNumber(listing.durationWeeks);
      if (durationWeeks !== null && (listingDuration === null || listingDuration !== durationWeeks)) {
        return false;
      }

      return true;
    });
  }, [filters, listings]);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const data = await apiRequest('/api/listings/public');
        setListings(data.listings || []);
      } catch (error) {
        if (error.status === 404 && user) {
          try {
            const privateListings = await apiRequest('/api/listings', { headers });
            setListings(privateListings.listings || []);
            return;
          } catch (fallbackError) {
            setStatus(fallbackError.message);
            return;
          }
        }

        if (error.status !== 404) {
          setStatus(error.message);
        }
      }
    };

    loadListings();
  }, [user]);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
      <h2 className="font-display text-3xl text-white">Explore Internships</h2>
      <p className="mt-2 text-zinc-400">Browse active roles and apply from your student dashboard.</p>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            placeholder="Location"
            value={filters.location}
            onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none ring-cyan-400/60 focus:ring"
          />
          <input
            type="number"
            placeholder="Min stipend"
            value={filters.minStipend}
            onChange={(event) => setFilters((prev) => ({ ...prev, minStipend: event.target.value }))}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none ring-cyan-400/60 focus:ring"
          />
          <input
            type="number"
            placeholder="Max stipend"
            value={filters.maxStipend}
            onChange={(event) => setFilters((prev) => ({ ...prev, maxStipend: event.target.value }))}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none ring-cyan-400/60 focus:ring"
          />
          <input
            type="number"
            placeholder="Duration (weeks)"
            value={filters.durationWeeks}
            onChange={(event) => setFilters((prev) => ({ ...prev, durationWeeks: event.target.value }))}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none ring-cyan-400/60 focus:ring"
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
          <span>Showing {filteredListings.length} of {listings.length} listings</span>
          <button
            type="button"
            onClick={() => setFilters({ location: '', minStipend: '', maxStipend: '', durationWeeks: '' })}
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {filteredListings.map((listing) => (
          <article key={listing._id} className="rounded-xl border border-zinc-800 bg-black p-4 transition hover:border-zinc-600">
            <Link to={`/internships/${listing._id}`} className="block">
              <h3 className="text-lg font-medium text-zinc-100">{listing.title}</h3>
              <p className="text-sm text-zinc-400">{listing.company} • {listing.location} • {listing.mode}</p>
              <p className="mt-1 text-xs text-zinc-500">Stipend: {listing.stipend} • Duration: {listing.durationWeeks} weeks</p>
              <p className="mt-2 text-xs text-zinc-500">Skills: {listing.skills.join(', ')}</p>
            </Link>
            <div className="mt-4">
              {user?.role === 'student' ? (
                <Link
                  to={`/internships/${listing._id}`}
                  className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-black"
                >
                  Details
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
                >
                  Login to apply
                </Link>
              )}
            </div>
          </article>
        ))}

        {filteredListings.length === 0 ? <p className="text-sm text-zinc-500">No internships match these filters.</p> : null}
      </div>
    </section>
  );
};

export default Internships;
