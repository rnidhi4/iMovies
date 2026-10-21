import { Link } from 'react-router-dom';
import { FaBuilding, FaFilm, FaRupeeSign, FaTicketAlt, FaUsers, FaVideo } from 'react-icons/fa';
import { fetchStats } from '../../api/adminApi';
import { getErrorMessage } from '../../api/http';
import useFetch from '../../hooks/useFetch';
import ErrorState from '../../components/ErrorState';
import Loader from '../../components/Loader';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/format';

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="col-6 col-lg-4">
      <div className="im-card stat-card h-100">
        <Icon className="text-danger mb-2" size={22} aria-hidden="true" />
        <div className="stat-value">{value}</div>
        <div className="small text-muted-im">{label}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const state = useFetch(fetchStats, []);

  if (state.loading) return <Loader label="Loading dashboard..." />;
  if (state.error) return <ErrorState title="Could not load the dashboard" message={getErrorMessage(state.error)} onRetry={state.refetch} />;

  const stats = state.data;

  return (
    <>
      <div className="row g-3 mb-4">
        <StatCard icon={FaRupeeSign} label="Total revenue (demo)" value={formatCurrency(stats.totalRevenue)} />
        <StatCard icon={FaTicketAlt} label={`Bookings (${stats.confirmedBookings} confirmed, ${stats.cancelledBookings} cancelled)`} value={stats.totalBookings} />
        <StatCard icon={FaUsers} label="Registered users" value={stats.totalUsers} />
        <StatCard icon={FaFilm} label="Movies" value={stats.totalMovies} />
        <StatCard icon={FaBuilding} label="Theatres" value={stats.totalTheatres} />
        <StatCard icon={FaVideo} label="Shows" value={stats.totalShows} />
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="h5 mb-0">Recent bookings</h2>
        <Link to="/admin/bookings" className="small">View all</Link>
      </div>
      <div className="table-responsive im-card">
        <table className="table table-im align-middle mb-0">
          <thead>
            <tr><th>Booking ID</th><th>Customer</th><th>Movie</th><th>Amount</th><th>Status</th><th>Booked</th></tr>
          </thead>
          <tbody>
            {(stats.recentBookings || []).length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted-im py-4">No bookings yet.</td></tr>
            )}
            {(stats.recentBookings || []).map((booking) => (
              <tr key={booking._id}>
                <td className="booking-ref small">{booking.reference}</td>
                <td>{booking.user?.name || 'Deleted user'}</td>
                <td>{booking.show?.movie?.title}</td>
                <td>{formatCurrency(booking.totalAmount)}</td>
                <td><StatusBadge status={booking.status} /></td>
                <td className="small">{formatDateTime(booking.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
