// IMovies shows times in Indian Standard Time (UTC+5:30, no daylight saving).
// Dates are stored in MongoDB as UTC moments; these helpers convert to and from IST days.
const IST_OFFSET_MINUTES = 330;
const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// "2026-10-18": today's date as seen in India
const todayInIST = (now = new Date()) =>
  new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

// The UTC start and end of one IST calendar day, e.g. "2026-10-18"
const istDayRange = (dateString) => {
  const start = new Date(`${dateString}T00:00:00+05:30`);
  return { start, end: new Date(start.getTime() + DAY_MS) };
};

// A UTC Date for "N days from today, at hour:minute IST"
const istDateTime = (dayOffset, hour, minute, now = new Date()) => {
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const utcMs = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + dayOffset, hour, minute);
  return new Date(utcMs - IST_OFFSET_MS);
};

module.exports = { IST_OFFSET_MS, DAY_MS, todayInIST, istDayRange, istDateTime };
