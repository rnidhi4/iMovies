import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft } from 'react-icons/fa';
import { fetchShow, fetchShowSeats } from '../api/showApi';
import { holdSeats } from '../api/bookingApi';
import { getErrorMessage } from '../api/http';
import useFetch from '../hooks/useFetch';
import SeatLayout from '../components/SeatLayout';
import BookingSummary from '../components/BookingSummary';
import ErrorState from '../components/ErrorState';
import Loader from '../components/Loader';
import { MAX_SEATS_PER_BOOKING } from '../utils/constants';
import { formatDateTime, formatCurrency } from '../utils/format';

const NO_ROWS = [];

export default function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const showState = useFetch(() => fetchShow(showId), [showId]);
  const seatsState = useFetch(() => fetchShowSeats(showId), [showId]);
  const [selected, setSelected] = useState([]);
  const [holding, setHolding] = useState(false);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const rows = seatsState.data || NO_ROWS;

  // label -> seat, so we can look up price and status quickly
  const seatMap = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => row.seats.forEach((seat) => map.set(seat.label, seat)));
    return map;
  }, [rows]);

  // Quietly reload seat availability every 15 seconds so other people's bookings appear.
  const { refetch: refetchSeats } = seatsState;
  useEffect(() => {
    const timer = setInterval(() => refetchSeats(true), 15000);
    return () => clearInterval(timer);
  }, [refetchSeats]);

  // If a seat I selected was taken by someone else, unselect it and tell me.
  useEffect(() => {
    if (seatMap.size === 0) return;
    const current = selectedRef.current;
    const stillFree = current.filter((label) => seatMap.get(label)?.status === 'AVAILABLE');
    if (stillFree.length !== current.length) {
      setSelected(stillFree);
      toast.warn('Some seats you selected were just taken and have been removed.');
    }
  }, [seatMap]);

  const selectedSeats = selected.map((label) => seatMap.get(label)).filter(Boolean);
  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const handleToggle = (seat) => {
    if (seat.status !== 'AVAILABLE') return;
    if (!selected.includes(seat.label) && selected.length >= MAX_SEATS_PER_BOOKING) {
      toast.info(`You can select up to ${MAX_SEATS_PER_BOOKING} seats per booking.`);
      return;
    }
    setSelected((previous) =>
      previous.includes(seat.label) ? previous.filter((label) => label !== seat.label) : [...previous, seat.label]
    );
  };

  // The server re-checks every seat. If anyone beat us to one, it answers 409 and we reload the seats.
  const handleProceed = async () => {
    setHolding(true);
    try {
      const booking = await holdSeats({ showId, seats: selected });
      toast.success('Seats reserved! Complete the payment before the timer runs out.');
      navigate(`/checkout/${booking._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
      refetchSeats(true);
    } finally {
      setHolding(false);
    }
  };

  if (showState.loading || (seatsState.loading && !seatsState.data)) {
    return <div className="container"><Loader fullPage label="Loading seats..." /></div>;
  }

  const loadError = showState.error || seatsState.error;
  if (loadError) {
    return (
      <div className="container py-4">
        <ErrorState
          title="Could not load this show"
          message={getErrorMessage(loadError)}
          onRetry={() => {
            showState.refetch();
            seatsState.refetch();
          }}
        >
          <Link to="/movies" className="btn btn-outline-secondary">Browse movies</Link>
        </ErrorState>
      </div>
    );
  }

  const show = showState.data;
  const hasStarted = new Date(show.startsAt) < new Date();

  return (
    <div className="container py-4">
      <Link to={`/movies/${show.movie._id}`} className="small d-inline-block mb-2">
        <FaArrowLeft className="me-1" aria-hidden="true" />Back to showtimes
      </Link>
      <h1 className="page-title mb-1">Select your seats</h1>
      <p className="text-muted-im mb-4">
        {show.movie.title} · {show.theatre.name} · {formatDateTime(show.startsAt)}
      </p>

      {hasStarted && (
        <div className="alert alert-warning" role="alert">This show has already started, so seats can no longer be booked.</div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="im-card p-3 p-md-4">
            <SeatLayout rows={rows} selected={selected} onToggle={handleToggle} pricing={show.pricing} />
          </div>
        </div>

        <div className="col-lg-4">
          <div className="summary-sticky">
            <BookingSummary show={show} seats={selectedSeats} total={total}>
              <p className="visually-hidden" aria-live="polite">
                {selectedSeats.length} seats selected, total {formatCurrency(total)}
              </p>
              <button
                type="button"
                className="btn btn-primary w-100"
                disabled={selectedSeats.length === 0 || holding || hasStarted}
                onClick={handleProceed}
              >
                {holding && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                {holding ? 'Reserving seats...' : 'Proceed to Checkout'}
              </button>
              <p className="small text-muted-im mt-2 mb-0">
                Your seats are held for a few minutes while you pay. You can choose up to {MAX_SEATS_PER_BOOKING} seats.
              </p>
            </BookingSummary>
          </div>
        </div>
      </div>
    </div>
  );
}
