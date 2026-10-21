import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import PosterImage from './PosterImage';
import { formatCurrency, formatDate, formatTime } from '../utils/format';

// show = { startsAt, movie, theatre, screen }, seats = [{ label, tier, price }]
// `children` is where the page puts its action buttons.
export default function BookingSummary({ show, seats, total, title = 'Booking summary', children }) {
  return (
    <aside className="im-card p-3 p-md-4" aria-label={title}>
      <h2 className="h5 mb-3">{title}</h2>

      <div className="d-flex gap-3 mb-3">
        <div className="thumb-poster">
          <PosterImage src={show.movie.posterUrl} alt="" />
        </div>
        <div>
          <h3 className="h6 mb-1">{show.movie.title}</h3>
          <p className="small text-muted-im mb-0">{show.movie.language}</p>
        </div>
      </div>

      <ul className="list-unstyled small mb-3">
        <li className="mb-1"><FaMapMarkerAlt className="me-2 text-danger" aria-hidden="true" />{show.theatre.name}, {show.theatre.city} ({show.screen.name})</li>
        <li className="mb-1"><FaCalendarAlt className="me-2 text-danger" aria-hidden="true" />{formatDate(show.startsAt)}</li>
        <li><FaClock className="me-2 text-danger" aria-hidden="true" />{formatTime(show.startsAt)}</li>
      </ul>

      <h3 className="h6">Seats</h3>
      {seats.length === 0 ? (
        <p className="small text-muted-im">No seats selected yet.</p>
      ) : (
        <div className="mb-3">
          {seats.map((seat) => (
            <span className="seat-chip" key={seat.label}>
              {seat.label} <span className="text-muted-im">({seat.tier === 'PREMIUM' ? 'Premium' : 'Standard'})</span>
            </span>
          ))}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center border-top pt-3 mb-3">
        <span>Total ({seats.length} {seats.length === 1 ? 'seat' : 'seats'})</span>
        <strong className="fs-5">{formatCurrency(total)}</strong>
      </div>

      {children}
    </aside>
  );
}
