import { useState } from 'react';
import { toast } from 'react-toastify';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { fetchMovies } from '../../api/movieApi';
import { deleteMovie } from '../../api/adminApi';
import { getErrorMessage } from '../../api/http';
import useFetch from '../../hooks/useFetch';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import PosterImage from '../../components/PosterImage';
import StatusBadge from '../../components/StatusBadge';
import MovieFormModal from '../../components/admin/MovieFormModal';

export default function AdminMovies() {
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null = closed, {} = add, movie = edit
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const state = useFetch(() => fetchMovies({ search, page, limit: 10 }), [search, page]);

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteMovie(deleting._id);
      toast.success(`"${deleting.title}" was deleted.`);
      setDeleting(null);
      state.refetch(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  let content;
  if (state.loading) content = <Loader label="Loading movies..." />;
  else if (state.error) content = <ErrorState title="Could not load movies" message={getErrorMessage(state.error)} onRetry={state.refetch} />;
  else if (state.data.movies.length === 0) content = <EmptyState title="No movies found" message="Add a movie or change your search." />;
  else {
    content = (
      <div className="table-responsive im-card">
        <table className="table table-im align-middle mb-0">
          <thead>
            <tr><th>Poster</th><th>Title</th><th>Language</th><th>Genres</th><th>Rating</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr>
          </thead>
          <tbody>
            {state.data.movies.map((movie) => (
              <tr key={movie._id}>
                <td><div className="thumb-poster" style={{ width: 42 }}><PosterImage src={movie.posterUrl} alt="" /></div></td>
                <td className="fw-semibold">{movie.title}</td>
                <td>{movie.language}</td>
                <td className="small">{movie.genres.join(', ')}</td>
                <td>{Number(movie.rating).toFixed(1)}</td>
                <td><StatusBadge status={movie.status} /></td>
                <td className="text-nowrap text-end">
                  <button type="button" className="btn btn-sm btn-outline-light me-2" onClick={() => setEditing(movie)} aria-label={`Edit ${movie.title}`}><FaEdit aria-hidden="true" /></button>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleting(movie)} aria-label={`Delete ${movie.title}`}><FaTrash aria-hidden="true" /></button>
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
      <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
        <form className="d-flex gap-2" onSubmit={applySearch} role="search">
          <label htmlFor="admin-movie-search" className="visually-hidden">Search movies</label>
          <input id="admin-movie-search" type="search" className="form-control" placeholder="Search by title" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
          <button type="submit" className="btn btn-outline-light">Search</button>
        </form>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({})}><FaPlus className="me-2" aria-hidden="true" />Add movie</button>
      </div>

      {content}
      <Pagination pagination={state.data?.pagination} onPageChange={setPage} />

      {editing && (
        <MovieFormModal
          movie={editing._id ? editing : undefined}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            state.refetch(true);
          }}
        />
      )}

      {deleting && (
        <ConfirmModal
          title="Delete movie?"
          message={`"${deleting.title}" will be removed. The server will refuse if it still has shows or bookings.`}
          confirmLabel="Delete movie"
          loading={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
