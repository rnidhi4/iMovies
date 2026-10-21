import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaLock, FaTimesCircle } from 'react-icons/fa';
import { cancelBooking, fetchBooking, payDemo } from '../api/bookingApi';
import { getErrorMessage } from '../api/http';
import useFetch from '../hooks/useFetch';
import useCountdown from '../hooks/useCountdown';
import BookingSummary from '../components/BookingSummary';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loader from '../components/Loader';

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const state = useFetch(() => fetchBooking(bookingId), [bookingId]);
  const booking = state.data?.booking;
  const isPending = booking?.status === 'PENDING_PAYMENT';

  const { label, expired, secondsLeft } = useCountdown(isPending ? booking.holdExpiresAt : null);
  const [paying, setPaying] = useState(null); // 'success' | 'failure' | null
  const [failedPayment, setFailedPayment] = useState(null);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    if (expired) toast.warn('Your seat hold has expired.');
  }, [expired]);

  if (state.loading) return <div className="container"><Loader fullPage label="Loading your booking..." /></div>;

  if (state.error) {
    return (
      <div className="container py-4">
        <ErrorState title="Could not load this booking" message={getErrorMessage(state.error)} onRetry={state.refetch}>
          <Link to="/my-bookings" className="btn btn-outline-secondary">My bookings</Link>
        </ErrorState>
      </div>
    );
  }

  if (booking.status === 'CONFIRMED') return <Navigate to={`/booking-confirmation/${booking._id}`} replace />;

  if (!isPending || expired) {
    const wasCancelled = booking.status === 'CANCELLED';
    return (
      <div className="container py-4">
        <EmptyState
          icon={FaTimesCircle}
          title={wasCancelled ? 'This booking was cancelled' : 'Your seat hold has expired'}
          message={wasCancelled ? 'The seats were released.' : 'The seats were released so others can book them. Please choose your seats again.'}
        >
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <Link to={`/movies/${booking.show.movie._id}`} className="btn btn-primary">Choose seats again</Link>
            <Link to="/my-bookings" className="btn btn-outline-secondary">My bookings</Link>
          </div>
        </EmptyState>
      </div>
    );
  }

  // Both buttons are disabled while a request is running, so a double click cannot pay twice.
  const pay = async (outcome) => {
    setPaying(outcome);
    setFailedPayment(null);
    try {
      const result = await payDemo(bookingId, outcome);
      if (result.payment.status === 'SUCCESS') {
        toast.success(result.message || 'Demo payment successful. Your booking is confirmed!');
        navigate(`/booking-confirmation/${bookingId}`, { replace: true });
      } else {
        setFailedPayment(result.payment);
        toast.error(result.message || 'Demo payment failed. You can try again.');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      state.refetch(true);
    } finally {
      setPaying(null);
    }
  };

  const release = async () => {
    setReleasing(true);
    try {
      await cancelBooking(bookingId, 'Seats released by user before payment');
      toast.info('Your seats have been released.');
      navigate(`/movies/${booking.show.movie._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setReleaseOpen(false);
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="container py-4">
      <h1 className="page-title mb-3">Checkout</h1>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="im-card p-4 mb-3 d-flex justify-content-between align-items-center gap-3">
            <div>
              <div className="small text-muted-im">Your seats are held for</div>
              <div className={`hold-timer ${secondsLeft < 60 ? 'urgent' : ''}`} role="timer">{label}</div>
            </div>
            <div className="text-end small text-muted-im">
              Booking ID
              <div className="booking-ref text-white">{booking.reference}</div>
            </div>
          </div>

          <div className="demo-banner p-3 mb-3" role="note">
            <FaLock className="me-2" aria-hidden="true" />
            <strong>DEMO PAYMENT.</strong> No real money is charged and no card details are collected.
            Choose an outcome below to simulate how a payment gateway would respond.
          </div>

          {failedPayment && (
            <div className="alert alert-danger" role="alert">
              <strong>Demo payment failed.</strong> {failedPayment.failureReason || 'The simulated payment was declined.'}{' '}
              Your seats are still held, so you can try again until the timer ends.
              <div className="small mt-1">Transaction reference: <span className="booking-ref">{failedPayment.transactionRef}</span></div>
            </div>
          )}

          <div className="im-card p-4">
            <h2 className="h5">Simulate a payment</h2>
            <p className="text-muted-im small">Pick what should happen when you pay for this booking.</p>
            <div className="d-grid gap-2 d-sm-flex">
              <button type="button" className="btn btn-success flex-fill" disabled={Boolean(paying)} onClick={() => pay('success')}>
                {paying === 'success' ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> : <FaCheckCircle className="me-2" aria-hidden="true" />}
                Simulate successful payment
              </button>
              <button type="button" className="btn btn-outline-danger flex-fill" disabled={Boolean(paying)} onClick={() => pay('failure')}>
                {paying === 'failure' ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> : <FaTimesCircle className="me-2" aria-hidden="true" />}
                Simulate failed payment
              </button>
            </div>
            <button type="button" className="btn btn-link text-muted-im p-0 mt-3" disabled={Boolean(paying)} onClick={() => setReleaseOpen(true)}>
              Release my seats and cancel
            </button>
          </div>
        </div>

        <div className="col-lg-5">
          <BookingSummary show={booking.show} seats={booking.seats} total={booking.totalAmount} title="Order summary" />
        </div>
      </div>

      {releaseOpen && (
        <ConfirmModal
          title="Release your seats?"
          message="Your seats will be released and this booking will be cancelled. You can choose seats again at any time."
          confirmLabel="Yes, release seats"
          cancelLabel="Keep my seats"
          loading={releasing}
          onConfirm={release}
          onCancel={() => setReleaseOpen(false)}
        />
      )}
    </div>
  );
}
