import { useState } from 'react';
import { toast } from 'react-toastify';
import { adminCancelBooking, fetchAdminBookings } from '../../api/adminApi';
import { getErrorMessage } from '../../api/http';
import useFetch from '../../hooks/useFetch';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/format';

const STATUSES = ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED'];

export default function AdminBookings() {
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const state = useFetch(() => fetchAdminBookings({ search, status, page, limit: 10 }), [search, status, page]);

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
  };

  const closeCancel = () => {
    setCancelTarget(null);
    setReason('');
  };

  // Admins can only cancel through the server's business rules (no free-form status editing).
  const confirmCancel = async () => {
    setBusy(true);
    try {
      const result = await adminCancelBooking(cancelTarget._id, reason.trim());
      toast.success(result.message || 'Booking cancelled.');
      closeCancel();
      state.refetch(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
      closeCancel();
    } finally {
      setBusy(false);
    }
  };

  let content;
  if (state.loading) content = <Loader label="Loading bookings..." />;
  else if (state.error) content = <ErrorState title="Could not load bookings" message={getErrorMessage(state.error)} onRetry={state.refetch} />;
  else if (state.data.bookings.length === 0) content = <EmptyState title="No bookings found" message="Try a different search or status filter." />;
  else {
    content = (
      <div className="table-responsive im-card">
        <table className="table table-im align-middle mb-0">
          <thead>
            <tr><th>Booking ID</th><th>Customer</th><th>Movie / show</th><th>Seats</th><th>Amount</th><th>Status</th><th>Payment</th><th><span className="visually-hidden">Actions</span></th></tr>
          </thead>
          <tbody>
            {state.data.bookings.map((booking) => (
              <tr key={booking._id}>
                <td className="booking-ref small">{booking.reference}</td>
                <td>
                  {booking.user?.name || 'Deleted user'}
                  <div className="small text-muted-im">{booking.user?.email}</div>
                </td>
                <td>
                  {booking.show?.movie?.title}
                  <div className="small text-muted-im">{booking.show?.theatre?.name} · {formatDateTime(booking.show?.startsAt)}</div>
                </td>
                <td className="small">{booking.seats.map((seat) => seat.label).join(', ')}</td>
                <td>{formatCurrency(booking.totalAmount)}</td>
                <td><StatusBadge status={booking.status} /></td>
                <td><StatusBadge status={booking.paymentStatus} /></td>
                <td className="text-end">
                  {booking.status === 'CONFIRMED' && (
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setCancelTarget(booking)}>Cancel</button>
                  )}
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
      <div className="d-flex flex-wrap gap-2 mb-3">
        <form className="d-flex gap-2 flex-grow-1" onSubmit={applySearch} role="search">
          <label htmlFor="admin-booking-search" className="visually-hidden">Search bookings</label>
          <input id="admin-booking-search" type="search" className="form-control" placeholder="Search by booking ID, name or email" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
          <button type="submit" className="btn btn-outline-light">Search</button>
        </form>
        <div>
          <label htmlFor="admin-booking-status" className="visually-hidden">Filter by status</label>
          <select id="admin-booking-status" className="form-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((value) => <option key={value} value={value}>{value.replace('_', ' ').toLowerCase()}</option>)}
          </select>
        </div>
      </div>

      {content}
      <Pagination pagination={state.data?.pagination} onPageChange={setPage} />

      {cancelTarget && (
        <ConfirmModal
          title="Cancel this booking?"
          message={`Booking ${cancelTarget.reference} will be cancelled, its seats released and a full demo refund recorded.`}
          confirmLabel="Cancel booking"
          cancelLabel="Keep booking"
          loading={busy}
          confirmDisabled={reason.trim().length < 3}
          onConfirm={confirmCancel}
          onCancel={closeCancel}
        >
          <label htmlFor="admin-cancel-reason" className="form-label small">Reason (required)</label>
          <textarea id="admin-cancel-reason" className="form-control" rows={2} maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} />
        </ConfirmModal>
      )}
    </>
  );
}
