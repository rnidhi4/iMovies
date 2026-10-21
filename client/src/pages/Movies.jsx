import { useSearchParams } from 'react-router-dom';
import { fetchMovies } from '../api/movieApi';
import useFetch from '../hooks/useFetch';
import MovieFilters from '../components/MovieFilters';
import MovieSection from '../components/MovieSection';
import Pagination from '../components/Pagination';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'NOW_SHOWING', label: 'Now Showing' },
  { value: 'UPCOMING', label: 'Upcoming' },
];

export default function Movies() {
  const [params, setParams] = useSearchParams();

  // The filters live in the address bar (?genre=Action&page=2) so links can be shared and the back button works.
  const filters = {
    search: params.get('search') || '',
    genre: params.get('genre') || '',
    language: params.get('language') || '',
    status: params.get('status') || '',
  };
  const page = Math.max(parseInt(params.get('page'), 10) || 1, 1);

  const updateParams = (changes) => {
    const next = { ...filters, page: 1, ...changes };
    const clean = Object.fromEntries(
      Object.entries(next).filter(([key, value]) => value !== '' && value != null && !(key === 'page' && value === 1))
    );
    setParams(clean, { replace: true });
  };

  const state = useFetch(() => fetchMovies({ ...filters, page, limit: 12 }), [params.toString()]);

  return (
    <div className="container py-4">
      <h1 className="page-title mb-3">Movies</h1>

      <MovieFilters
        filters={filters}
        onChange={(changes) => updateParams(changes)}
        onClear={() => updateParams({ search: '', genre: '', language: '' })}
      />

      <div className="nav nav-pills mb-2" role="group" aria-label="Movie status">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            type="button"
            className={`nav-link ${filters.status === tab.value ? 'active bg-danger' : ''}`}
            aria-pressed={filters.status === tab.value}
            onClick={() => updateParams({ status: tab.value })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <MovieSection
        title="Results"
        subtitle={state.data ? `${state.data.pagination.total} movie(s) found` : undefined}
        state={state}
        skeletonCount={12}
        emptyTitle="No movies match your search"
        emptyMessage="Try a different title or clear some filters."
      />

      <Pagination
        pagination={state.data?.pagination}
        onPageChange={(nextPage) => {
          updateParams({ page: nextPage });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
