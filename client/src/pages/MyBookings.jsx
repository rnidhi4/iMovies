import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTicketAlt } from 'react-icons/fa';
import { fetchBookings } from '../api/bookingApi';
import { getErrorMessage } from '../api/http';
import useFetch from '../hooks/useFetch';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import PosterImage from '../components/PosterImage';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDateTime } from '../utils/format';

function BookingCard({ booking }) {
  const { show } = booking;
  const canPay = booking.status === 'PENDING_PAYMENT' && new Date(booking.holdExpiresAt) > new Date();

  return (
    <article className="im-card p-3 mb-3">
      <div className="d-flex gap-3">
        <div className="thumb-poster">
          <PosterImage src={show.movie.posterUrl} alt="" />
        </div>
        <div className="flex-grow-1">
          <div className="d-flex flex-wrap justify-content-between gap-2">
            <h2 className="h6 mb-1">{show.movie.title}</h2>
            <div className="d-flex gap-2">
              <StatusBadge status={booking.status} />
              <StatusBadge status={booking.paymentStatus} />
            </div>
          </div>
          <p className="small text-muted-im mb-1">{show.theatre.name}, {show.theatre.city} · {formatDateTime(show.startsAt)}</p>
          <p className="small mb-2">
            Seats: {booking.seats.map((seat) => seat.label).join(', ')} · <strong>{formatCurrency(booking.totalAmount)}</strong>
          </p>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="booking-ref small text-muted-im">{booking.reference}</span>
            <span className="ms-auto d-flex gap-2">
              {canPay && <Link to={`/checkout/${booking._id}`} className="btn btn-sm btn-primary">Complete payment</Link>}
              <Link to={`/bookings/${booking._id}`} className="btn btn-sm btn-outline-light">View details</Link>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MyBookings() {
  const [scope, setScope] = useState('upcoming');
  const [page, setPage] = useState(1);
  const state = useFetch(() => fetchBookings({ scope, page, limit: 6 }), [scope, page]);

  const changeScope = (nextScope) => {
    setScope(nextScope);
    setPage(1);
  };

  let content;
  if (state.loading) {
    content = <Loader label="Loading your bookings..." />;
  } else if (state.error) {
    content = <ErrorState title="Could not load your bookings" message={getErrorMessage(state.error)} onRetry={state.refetch} />;
  } else if (state.data.bookings.length === 0) {
    content = (
      <EmptyState
        icon={FaTicketAlt}
        title={scope === 'upcoming' ? 'No upcoming bookings' : 'No past or cancelled bookings'}
        message={scope === 'upcoming' ? 'Book a movie and your tickets will show up here.' : 'Finished and cancelled bookings will appear here.'}
      >
        {scope === 'upcoming' && <Link to="/movies" className="btn btn-primary">Browse movies</Link>}
      </EmptyState>
    );
  } else {
    content = state.data.bookings.map((booking) => <BookingCard key={booking._id} booking={booking} />);
  }

  return (
    <div className="container py-4" style={{ maxWidth: '52rem' }}>
      <h1 className="page-title mb-3">My Bookings</h1>

      <div className="nav nav-pills mb-3" role="group" aria-label="Booking filter">
        <button type="button" className={`nav-link ${scope === 'upcoming' ? 'active bg-danger' : ''}`} aria-pressed={scope === 'upcoming'} onClick={() => changeScope('upcoming')}>
          Upcoming
        </button>
        <button type="button" className={`nav-link ${scope === 'past' ? 'active bg-danger' : ''}`} aria-pressed={scope === 'past'} onClick={() => changeScope('past')}>
          Past &amp; cancelled
        </button>
      </div>

      {content}

      <Pagination pagination={state.data?.pagination} onPageChange={setPage} />
    </div>
  );
}
