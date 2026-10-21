import { useMemo, useState } from 'react';
import { FaEdit, FaPlus } from 'react-icons/fa';
import { fetchAdminShows, fetchAdminTheatres } from '../../api/adminApi';
import { fetchMovies } from '../../api/movieApi';
import { getErrorMessage } from '../../api/http';
import useFetch from '../../hooks/useFetch';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import ShowFormModal from '../../components/admin/ShowFormModal';
import { formatCurrency, formatDateTime } from '../../utils/format';

export default function AdminShows() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null = closed, {} = add, show = edit
  const state = useFetch(() => fetchAdminShows({ page, limit: 10 }), [page]);
  const moviesState = useFetch(() => fetchMovies({ limit: 50 }), []);
  const theatresState = useFetch(fetchAdminTheatres, []);

  // "Theatre - Screen" choices for the form
  const screenOptions = useMemo(
    () =>
      (theatresState.data || []).flatMap((theatre) =>
        (theatre.screens || []).map((screen) => ({ _id: screen._id, label: `${theatre.name} - ${screen.name}` }))
      ),
    [theatresState.data]
  );
  const movies = moviesState.data?.movies || [];
  const formReady = !moviesState.loading && !theatresState.loading;
  const canAdd = movies.length > 0 && screenOptions.length > 0;

  let content;
  if (state.loading) content = <Loader label="Loading shows..." />;
  else if (state.error) content = <ErrorState title="Could not load shows" message={getErrorMessage(state.error)} onRetry={state.refetch} />;
  else if (state.data.shows.length === 0) content = <EmptyState title="No shows yet" message="Create a show so customers can book seats." />;
  else {
    content = (
      <div className="table-responsive im-card">
        <table className="table table-im align-middle mb-0">
          <thead>
            <tr><th>Movie</th><th>Theatre / screen</th><th>Starts</th><th>Standard</th><th>Premium</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr>
          </thead>
          <tbody>
            {state.data.shows.map((show) => (
              <tr key={show._id}>
                <td className="fw-semibold">{show.movie?.title}</td>
                <td>{show.theatre?.name} <span className="text-muted-im small">({show.screen?.name})</span></td>
                <td className="small">{formatDateTime(show.startsAt)}</td>
                <td>{formatCurrency(show.pricing.STANDARD)}</td>
                <td>{formatCurrency(show.pricing.PREMIUM)}</td>
                <td>{show.isActive ? <span className="badge text-bg-success">Active</span> : <span className="badge text-bg-secondary">Inactive</span>}</td>
                <td className="text-end">
                  <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setEditing(show)} aria-label={`Edit show of ${show.movie?.title}`}><FaEdit aria-hidden="true" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0">Shows</h2>
        <button type="button" className="btn btn-primary" disabled={!formReady || !canAdd} onClick={() => setEditing({})}>
          <FaPlus className="me-2" aria-hidden="true" />Add show
        </button>
      </div>
      {formReady && !canAdd && (
        <div className="alert alert-info" role="status">To create a show you need at least one movie and one theatre screen.</div>
      )}

      {content}
      <Pagination pagination={state.data?.pagination} onPageChange={setPage} />

      {editing && (
        <ShowFormModal
          show={editing._id ? editing : undefined}
          movies={movies}
          screens={screenOptions}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            state.refetch(true);
          }}
        />
      )}
    </>
  );
}
