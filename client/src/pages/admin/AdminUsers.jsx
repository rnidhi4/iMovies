import { useState } from 'react';
import { fetchAdminUsers } from '../../api/adminApi';
import { getErrorMessage } from '../../api/http';
import useFetch from '../../hooks/useFetch';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

export default function AdminUsers() {
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const state = useFetch(() => fetchAdminUsers({ search, page, limit: 15 }), [search, page]);

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
  };

  let content;
  if (state.loading) content = <Loader label="Loading users..." />;
  else if (state.error) content = <ErrorState title="Could not load users" message={getErrorMessage(state.error)} onRetry={state.refetch} />;
  else if (state.data.users.length === 0) content = <EmptyState title="No users found" message="Try a different search." />;
  else {
    content = (
      <div className="table-responsive im-card">
        <table className="table table-im align-middle mb-0">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>
            {state.data.users.map((user) => (
              <tr key={user._id}>
                <td className="fw-semibold">{user.name}</td>
                <td>{user.email}</td>
                <td><span className={`badge text-bg-${user.role === 'admin' ? 'danger' : 'secondary'}`}>{user.role}</span></td>
                <td className="small">{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <form className="d-flex gap-2 mb-3" onSubmit={applySearch} role="search">
        <label htmlFor="admin-user-search" className="visually-hidden">Search users</label>
        <input id="admin-user-search" type="search" className="form-control" placeholder="Search by name or email" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
        <button type="submit" className="btn btn-outline-light">Search</button>
      </form>
      {content}
      <Pagination pagination={state.data?.pagination} onPageChange={setPage} />
    </>
  );
}
