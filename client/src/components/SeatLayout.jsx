import { Fragment } from 'react';
import { formatCurrency } from '../utils/format';

// rows: [{ label, tier, aisleAfter, seats: [{ label, number, tier, price, status }] }]
// selected: array of seat labels, onToggle(seat) is called when a seat is clicked.
export default function SeatLayout({ rows, selected, onToggle, pricing }) {
  const describe = (seat, isSelected) => {
    if (isSelected) return 'selected';
    if (seat.status === 'BOOKED') return 'already booked';
    if (seat.status === 'HELD') return 'temporarily held by another user';
    return 'available';
  };

  return (
    <div>
      <div className="screen-bar" aria-hidden="true" />
      <div className="screen-label" aria-hidden="true">SCREEN THIS WAY</div>

      <div className="seat-map">
        <div className="seat-map-inner">
          {rows.map((row) => (
            <div className="seat-row" role="group" aria-label={`Row ${row.label}`} key={row.label}>
              <span className="seat-row-label" aria-hidden="true">{row.label}</span>
              {row.seats.map((seat) => {
                const isSelected = selected.includes(seat.label);
                const unavailable = seat.status !== 'AVAILABLE';
                let className = 'seat';
                if (seat.tier === 'PREMIUM') className += ' seat-premium';
                if (isSelected) className += ' seat-selected';
                else if (seat.status === 'BOOKED') className += ' seat-booked';
                else if (seat.status === 'HELD') className += ' seat-held';

                return (
                  <Fragment key={seat.label}>
                    <button
                      type="button"
                      className={className}
                      disabled={unavailable}
                      aria-pressed={isSelected}
                      aria-label={`Seat ${seat.label}, ${seat.tier.toLowerCase()}, ${formatCurrency(seat.price)}, ${describe(seat, isSelected)}`}
                      onClick={() => onToggle(seat)}
                    >
                      {seat.number}
                    </button>
                    {row.aisleAfter && row.aisleAfter.includes(seat.number) && <span className="seat-gap" aria-hidden="true" />}
                  </Fragment>
                );
              })}
              <span className="seat-row-label" aria-hidden="true">{row.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ul className="list-unstyled d-flex flex-wrap justify-content-center gap-3 mt-4 mb-0" aria-label="Seat legend">
        <li className="legend-item"><span className="seat" /> Standard{pricing ? ` ${formatCurrency(pricing.STANDARD)}` : ''}</li>
        <li className="legend-item"><span className="seat seat-premium" /> Premium{pricing ? ` ${formatCurrency(pricing.PREMIUM)}` : ''}</li>
        <li className="legend-item"><span className="seat seat-selected" /> Selected</li>
        <li className="legend-item"><span className="seat seat-booked" /> Booked</li>
        <li className="legend-item"><span className="seat seat-held" /> On hold</li>
      </ul>
    </div>
  );
}
