import { Link, useParams } from 'react-router-dom';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { fetchBooking } from '../api/bookingApi';
import { getErrorMessage } from '../api/http';
import useFetch from '../hooks/useFetch';
import ErrorState from '../components/ErrorState';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDateTime } from '../utils/format';

function Detail({ label, children }) {
  return (
    <div className="col-sm-6">
      <div className="small text-muted-im">{label}</div>
      <div className="fw-semibold">{children}</div>
    </div>
  );
}

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const state = useFetch(() => fetchBooking(bookingId), [bookingId]);

  if (state.loading) return <div className="container"><Loader fullPage label="Loading your ticket..." /></div>;

  if (state.error) {
    return (
      <div className="container py-4">
        <ErrorState title="Could not load this booking" message={getErrorMessage(state.error)} onRetry={state.refetch}>
          <Link to="/my-bookings" className="btn btn-outline-secondary">My bookings</Link>
        </ErrorState>
      </div>
    );
  }

  const { booking, payment } = state.data;
  const confirmed = booking.status === 'CONFIRMED';

  return (
    <div className="container py-4" style={{ maxWidth: '46rem' }}>
      <div className="text-center mb-4">
        {confirmed ? (
          <>
            <FaCheckCircle size={52} className="text-success mb-2" aria-hidden="true" />
            <h1 className="page-title">Booking confirmed!</h1>
            <p className="text-muted-im">Show your booking ID at the theatre. Enjoy the movie!</p>
          </>
        ) : (
          <>
            <FaExclamationTriangle size={52} className="text-warning mb-2" aria-hidden="true" />
            <h1 className="page-title">This booking is not confirmed</h1>
            <p className="text-muted-im">Its current status is shown below.</p>
          </>
        )}
      </div>

      <div className="ticket p-4 mb-4">
        <div className="row g-3">
          <Detail label="Booking ID"><span className="booking-ref">{booking.reference}</span></Detail>
          <Detail label="Booking status"><StatusBadge status={booking.status} /></Detail>
          <Detail label="Movie">{booking.show.movie.title}</Detail>
          <Detail label="Showtime">{formatDateTime(booking.show.startsAt)}</Detail>
          <Detail label="Theatre">{booking.show.theatre.name}, {booking.show.theatre.city} ({booking.show.screen.name})</Detail>
          <Detail label="Seats">{booking.seats.map((seat) => seat.label).join(', ')}</Detail>
          <Detail label="Total amount">{formatCurrency(booking.totalAmount)}</Detail>
          <Detail label="Payment status"><StatusBadge status={booking.paymentStatus} /> <span className="small text-muted-im">(demo)</span></Detail>
          {payment && <Detail label="Payment reference"><span className="booking-ref">{payment.transactionRef}</span></Detail>}
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 justify-content-center">
        {booking.status === 'PENDING_PAYMENT' && (
          <Link to={`/checkout/${booking._id}`} className="btn btn-primary">Complete payment</Link>
        )}
        <Link to={`/bookings/${booking._id}`} className="btn btn-primary">View booking details</Link>
        <Link to="/my-bookings" className="btn btn-outline-light">My bookings</Link>
        <Link to="/" className="btn btn-outline-secondary">Back to home</Link>
      </div>
    </div>
  );
}
