import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft } from 'react-icons/fa';
import { cancelBooking, fetchBooking } from '../api/bookingApi';
import { getErrorMessage } from '../api/http';
import useFetch from '../hooks/useFetch';
import BookingSummary from '../components/BookingSummary';
import ConfirmModal from '../components/ConfirmModal';
import ErrorState from '../components/ErrorState';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { CANCELLATION_POLICY } from '../utils/constants';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function BookingDetails() {
  const { bookingId } = useParams();
  const state = useFetch(() => fetchBooking(bookingId), [bookingId]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState('');

  if (state.loading) return <div className="container"><Loader fullPage label="Loading booking..." /></div>;

  if (state.error) {
    return (
      <div className="container py-4">
        <ErrorState title="Could not load this booking" message={getErrorMessage(state.error)} onRetry={state.refetch}>
          <Link to="/my-bookings" className="btn btn-outline-secondary">My bookings</Link>
        </ErrorState>
      </div>
    );
  }

  const { booking, payment, eligibility } = state.data;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const result = await cancelBooking(bookingId, reason.trim());
      toast.success(result.message || 'Your booking has been cancelled.');
      setNotice(result.message || 'Your booking has been cancelled.');
      setCancelOpen(false);
      setReason('');
      state.refetch(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setCancelOpen(false);
      state.refetch(true);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container py-4">
      <Link to="/my-bookings" className="small d-inline-block mb-2">
        <FaArrowLeft className="me-1" aria-hidden="true" />Back to my bookings
      </Link>
      <h1 className="page-title mb-1">Booking details</h1>
      <p className="mb-4">
        <span className="booking-ref text-muted-im me-3">{booking.reference}</span>
        <StatusBadge status={booking.status} /> <StatusBadge status={booking.paymentStatus} />
      </p>

      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      <div className="row g-4">
        <div className="col-lg-7">
          {booking.status === 'CANCELLED' && (
            <div className="im-card p-4 mb-3">
              <h2 className="h5">Cancellation</h2>
              <ul className="list-unstyled mb-0 small">
                {booking.cancellation?.cancelledBy === 'ADMIN' && <li><strong>Cancelled by admin</strong></li>}
                <li>Cancelled on: {booking.cancelledAt ? formatDateTime(booking.cancelledAt) : 'N/A'}</li>
                {booking.cancellation?.reason && <li>Reason: {booking.cancellation.reason}</li>}
                {booking.cancellation?.refundAmount > 0 ? (
                  <li>Demo refund: <strong>{formatCurrency(booking.cancellation.refundAmount)}</strong> ({booking.cancellation.refundPercent}%)</li>
                ) : (
                  <li>No refund was due for this booking.</li>
                )}
                <li>The seats have been released.</li>
              </ul>
            </div>
          )}

          <div className="im-card p-4 mb-3">
            <h2 className="h5">Payment</h2>
            {payment ? (
              <ul className="list-unstyled mb-0 small">
                <li>Status: <StatusBadge status={payment.status} /> <span className="text-muted-im">(DEMO payment)</span></li>
                <li>Amount: {formatCurrency(payment.amount)}</li>
                <li>Reference: <span className="booking-ref">{payment.transactionRef}</span></li>
                {payment.failureReason && <li>Note: {payment.failureReason}</li>}
                {payment.refundedAmount > 0 && <li>Refunded: {formatCurrency(payment.refundedAmount)}</li>}
              </ul>
            ) : (
              <p className="small text-muted-im mb-0">No payment has been made yet.</p>
            )}
          </div>

          {booking.status === 'PENDING_PAYMENT' && new Date(booking.holdExpiresAt) > new Date() && (
            <Link to={`/checkout/${booking._id}`} className="btn btn-primary mb-3">Complete payment</Link>
          )}

          {eligibility && booking.status === 'CONFIRMED' && (
            <div className="im-card p-4">
              <h2 className="h5">Cancel this booking</h2>
              {eligibility.canCancel ? (
                <>
                  <p className="small">
                    If you cancel now you will get a demo refund of{' '}
                    <strong>{formatCurrency(eligibility.refundAmount)}</strong> ({eligibility.refundPercent}%).
                  </p>
                  <button type="button" className="btn btn-outline-danger" onClick={() => setCancelOpen(true)}>Cancel booking</button>
                </>
              ) : (
                <p className="small mb-0">{eligibility.message || 'This booking can no longer be cancelled.'}</p>
              )}
              <hr />
              <h3 className="h6">Cancellation policy</h3>
              <ul className="small text-muted-im mb-0">
                {CANCELLATION_POLICY.map((rule) => <li key={rule}>{rule}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="col-lg-5">
          <BookingSummary show={booking.show} seats={booking.seats} total={booking.totalAmount} title="Your booking" />
        </div>
      </div>

      {cancelOpen && (
        <ConfirmModal
          title="Cancel this booking?"
          message={`This will release your seats and refund ${formatCurrency(eligibility.refundAmount)} (demo). This cannot be undone.`}
          confirmLabel="Yes, cancel booking"
          cancelLabel="Keep booking"
          loading={cancelling}
          onConfirm={handleCancel}
          onCancel={() => setCancelOpen(false)}
        >
          <label htmlFor="cancel-reason" className="form-label small">Reason (optional)</label>
          <textarea id="cancel-reason" className="form-control" rows={2} maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} />
        </ConfirmModal>
      )}
    </div>
  );
}
