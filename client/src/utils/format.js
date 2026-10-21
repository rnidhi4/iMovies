// All times are shown in Indian Standard Time, whatever the browser's timezone is.
const IST = 'Asia/Kolkata';

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const formatDate = (iso) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));

export const formatTime = (iso) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date(iso))
    .toUpperCase();

export const formatDateTime = (iso) => `${formatDate(iso)}, ${formatTime(iso)}`;

export const formatDuration = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

// "2026-10-17" for the given moment, as seen in India
export const toISTDateString = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(date);

// The next `count` days (today first) for the date picker
export const getNextDays = (count = 7) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.now() + index * 24 * 60 * 60 * 1000);
    return {
      value: toISTDateString(date),
      weekday: index === 0 ? 'Today' : new Intl.DateTimeFormat('en-IN', { timeZone: IST, weekday: 'short' }).format(date),
      day: new Intl.DateTimeFormat('en-IN', { timeZone: IST, day: 'numeric' }).format(date),
      month: new Intl.DateTimeFormat('en-IN', { timeZone: IST, month: 'short' }).format(date),
    };
  });

// Value for <input type="datetime-local"> (uses the browser's own timezone)
export const toDateTimeLocalValue = (iso) => {
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Value for <input type="date">
export const toDateInputValue = (iso) => (iso ? String(iso).slice(0, 10) : '');

// Turns a YouTube watch/share link into an embeddable one. Returns null for other sites.
export const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    let id = null;
    if (parsed.hostname === 'youtu.be') id = parsed.pathname.slice(1);
    else if (parsed.hostname.endsWith('youtube.com')) {
      if (parsed.pathname === '/watch') id = parsed.searchParams.get('v');
      else if (parsed.pathname.startsWith('/embed/')) id = parsed.pathname.split('/')[2];
    }
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : null;
  } catch (error) {
    return null;
  }
};

export const statusLabel = (status) =>
  String(status || '')
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
