const seatService = require('./seatService');

const DEFAULT_INTERVAL_MS = 60 * 1000; // once a minute

/**
 * Starts the clean-up timer for unpaid seat holds.
 *
 * Every minute it calls seatService.expireStaleHolds(), which:
 *  - looks only at bookings that are still PENDING_PAYMENT and whose hold time has run out,
 *  - frees only the seats that are still HELD by those bookings,
 *  - marks those bookings EXPIRED.
 * It never touches CONFIRMED / CANCELLED bookings, BOOKED seats, payments, or other people's holds.
 * (Customers already see such holds as "expired"; this just makes the database match.)
 *
 * Safe behaviour:
 *  - two sweeps never run at the same time,
 *  - an error is logged and the next minute simply tries again (the server never crashes),
 *  - the timer is unref'd, so it can never keep the process alive on its own,
 *  - stop() stops the timer and waits for a sweep that is already running.
 */
const startHoldSweeper = ({ intervalMs = DEFAULT_INTERVAL_MS, logger = console } = {}) => {
  let current = null; // the sweep that is running right now, if any
  let stopped = false;

  const sweep = () => {
    if (stopped || current) return current || Promise.resolve(0);
    current = (async () => {
      try {
        const count = await seatService.expireStaleHolds();
        if (count > 0) logger.log(`Hold sweeper: released ${count} expired unpaid hold(s)`);
        return count;
      } catch (error) {
        logger.error('Hold sweeper failed (it will try again):', error.message);
        return 0;
      } finally {
        current = null;
      }
    })();
    return current;
  };

  const timer = setInterval(sweep, intervalMs);
  timer.unref();
  sweep(); // clean up anything that expired while the server was off

  const stop = async () => {
    stopped = true;
    clearInterval(timer);
    if (current) await current;
  };

  return { stop, sweep };
};

module.exports = { startHoldSweeper, DEFAULT_INTERVAL_MS };
