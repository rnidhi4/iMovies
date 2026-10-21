import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';

// Hiding admin pages is only for convenience. The real protection is on the server,
// which rejects admin API calls from anyone who is not an admin.
export default function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullPage label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isAdmin) {
    return (
      <div className="container py-5">
        <ErrorState title="Admins only" message="You do not have permission to view this page.">
          <Link to="/" className="btn btn-outline-secondary">Back to home</Link>
        </ErrorState>
      </div>
    );
  }
  return <Outlet />;
}
