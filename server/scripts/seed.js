/**
 * Fills the database with FICTIONAL sample data so the website has something to show.
 *
 *   npm run seed     (blocked unless CONFIRM_SEED=yes is set for that one command)
 *
 * It DELETES every movie, theatre, screen, show, seat, booking and payment in the database named in
 * your MONGODB_URI, then recreates them. Users are never deleted. Two demo users are added if missing.
 * The sample movies are made up, and their posters are placeholder images (placehold.co), so no real
 * film artwork is used. If a poster ever fails to load, the website shows its built-in fallback image.
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { mongoUri, isProduction } = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const models = require('../src/models');
const { buildSeatDocs, computeEndsAt } = require('../src/services/showService');
const { istDateTime, DAY_MS } = require('../src/utils/time');
const { MOVIE_STATUS, SEAT_STATUS, ROLES } = require('../src/config/constants');

const SHOW_DAYS = 7; // shows are created for today and the next 6 days
const SLOTS = [
  { hour: 11, minute: 0, extra: 0 },
  { hour: 15, minute: 0, extra: 0 },
  { hour: 19, minute: 30, extra: 30 }, // evening shows cost a little more
];

const poster = (title, background) =>
  `https://placehold.co/400x600/${background}/ffffff/png?text=${encodeURIComponent(title).replace(/%20/g, '+')}`;

// Sample trailer links go to open-licensed short films by the Blender Foundation. They only exist
// to demonstrate the trailer player. Replace them with real trailer links whenever you like.
const TRAILERS = {
  tearsOfSteel: 'https://www.youtube.com/watch?v=R6MlUcmOul8',
  bigBuckBunny: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  sintel: 'https://www.youtube.com/watch?v=eRsGyueVLvQ',
};

// releaseOffsetDays: negative = released that many days ago, positive = releases in that many days
const MOVIES = [
  { title: 'Midnight Express Run', description: 'A retired train driver has one night to stop a runaway express carrying a secret that could bring down a city.', genres: ['Action', 'Thriller'], language: 'Hindi', durationMins: 138, rating: 8.1, cast: ['Aarav Malhotra', 'Meera Kapoor', 'Rohan Desai'], status: MOVIE_STATUS.NOW_SHOWING, releaseOffsetDays: -12, color: '7a1020', trailerUrl: '' },
  { title: 'The Last Lighthouse', description: 'A lonely keeper discovers that the lighthouse he guards has been signalling to something far out at sea.', genres: ['Drama', 'Thriller'], language: 'English', durationMins: 124, rating: 7.6, cast: ['Daniel Hart', 'Elena Brooks', 'Samuel Reid'], status: MOVIE_STATUS.NOW_SHOWING, releaseOffsetDays: -20, color: '1f3a5f', trailerUrl: TRAILERS.sintel },
  { title: 'Chai & Chaos', description: 'Two rival tea-stall owners are forced to share a single lane when a wedding procession blocks the street for a day.', genres: ['Comedy', 'Romance'], language: 'Hindi', durationMins: 126, rating: 7.2, cast: ['Kabir Sethi', 'Ishita Rao', 'Vivaan Joshi'], status: MOVIE_STATUS.NOW_SHOWING, releaseOffsetDays: -8, color: '8a5a12', trailerUrl: '' },
  { title: 'Neon Horizon', description: 'In a city that never sleeps, a courier finds a message from the future and a countdown that has already started.', genres: ['Sci-Fi', 'Adventure'], language: 'English', durationMins: 142, rating: 8.4, cast: ['Maya Lin', 'Jonas Weber', 'Priya Nair'], status: MOVIE_STATUS.NOW_SHOWING, releaseOffsetDays: -15, color: '3b1d6e', trailerUrl: TRAILERS.tearsOfSteel },
  { title: 'Kaveri Nights', description: 'A boatman and a returning doctor cross paths over one monsoon season on the banks of a restless river.', genres: ['Drama', 'Romance'], language: 'Tamil', durationMins: 131, rating: 7.9, cast: ['Arjun Selvam', 'Divya Raghavan', 'Karthik Mohan'], status: MOVIE_STATUS.NOW_SHOWING, releaseOffsetDays: -5, color: '0f5a4a', trailerUrl: '' },
  { title: 'Dragon Kite', description: 'Two siblings follow a magical kite across the sky to return a lost baby dragon to its mountain home.', genres: ['Animation', 'Adventure'], language: 'English', durationMins: 98, rating: 7.7, cast: ['Mia Collins', 'Leo Grant', 'Nora Fields'], status: MOVIE_STATUS.NOW_SHOWING, releaseOffsetDays: -25, color: 'a3361c', trailerUrl: TRAILERS.bigBuckBunny },
  { title: 'Shadow Syndicate', description: 'An undercover officer rises through a ruthless crime family while the line between duty and loyalty fades.', genres: ['Crime', 'Action'], language: 'Telugu', durationMins: 149, rating: 7.4, cast: ['Ravi Teja Varma', 'Anjali Reddy', 'Nikhil Chandra'], status: MOVIE_STATUS.NOW_SHOWING, releaseOffsetDays: -3, color: '222a35', trailerUrl: '' },
  { title: 'Monsoon Heist', description: 'A crew of unlikely thieves plans the perfect robbery during the one night the city floods.', genres: ['Crime', 'Comedy'], language: 'Hindi', durationMins: 133, rating: 0, cast: ['Tanmay Bedi', 'Sana Qureshi', 'Harsh Vora'], status: MOVIE_STATUS.UPCOMING, releaseOffsetDays: 14, color: '17445f', trailerUrl: '' },
  { title: 'Starfall Protocol', description: 'When a fleet of silent ships arrives, a small team of scientists has seventy-two hours to decide humanity\'s answer.', genres: ['Sci-Fi', 'Action'], language: 'English', durationMins: 151, rating: 0, cast: ['Ava Sterling', 'Marcus Doyle', 'Yuki Tanaka'], status: MOVIE_STATUS.UPCOMING, releaseOffsetDays: 28, color: '0d2b4a', trailerUrl: '' },
  { title: 'The Quiet Orchard', description: 'A widow and her estranged grandson restore a forgotten orchard and, slowly, each other.', genres: ['Drama'], language: 'Malayalam', durationMins: 118, rating: 0, cast: ['Meenakshi Nair', 'Adithya Menon', 'Lakshmi Pillai'], status: MOVIE_STATUS.UPCOMING, releaseOffsetDays: 40, color: '3f5b2a', trailerUrl: '' },
];

const THEATRES = [
  {
    name: 'Starlight Cineplex', city: 'Indore', address: 'Plot 12, AB Road, Vijay Nagar, Indore',
    screens: [
      { name: 'Screen 1', rows: 8, seatsPerRow: 12, premiumRows: 2, aisleAfter: 6, pricing: { STANDARD: 220, PREMIUM: 380 } },
      { name: 'Screen 2', rows: 6, seatsPerRow: 10, premiumRows: 1, aisleAfter: 5, pricing: { STANDARD: 180, PREMIUM: 320 } },
    ],
  },
  {
    name: 'Regal Square Multiplex', city: 'Indore', address: '12 MG Road, Indore',
    screens: [
      { name: 'Screen 1', rows: 10, seatsPerRow: 14, premiumRows: 3, aisleAfter: 7, pricing: { STANDARD: 250, PREMIUM: 420 } },
      { name: 'Screen 2', rows: 7, seatsPerRow: 12, premiumRows: 2, aisleAfter: 6, pricing: { STANDARD: 200, PREMIUM: 350 } },
    ],
  },
  {
    name: 'Lakeview Talkies', city: 'Bhopal', address: 'Arera Colony, Bhopal',
    screens: [
      { name: 'Screen 1', rows: 7, seatsPerRow: 12, premiumRows: 2, aisleAfter: 6, pricing: { STANDARD: 200, PREMIUM: 340 } },
    ],
  },
];

const SAMPLE_USERS = [
  { name: 'Demo Viewer One', email: 'demo.user1@example.com' },
  { name: 'Demo Viewer Two', email: 'demo.user2@example.com' },
];

// Rows are lettered A, B, C... and the LAST rows (furthest from the screen) are premium.
const buildLayout = ({ rows, seatsPerRow, premiumRows, aisleAfter }) =>
  Array.from({ length: rows }, (_, index) => ({
    label: String.fromCharCode(65 + index),
    seatCount: seatsPerRow,
    tier: index >= rows - premiumRows ? 'PREMIUM' : 'STANDARD',
    aisleAfter: aisleAfter > 0 && aisleAfter < seatsPerRow ? [aisleAfter] : [],
  }));

// Builds every document in memory (no database needed). `newId` creates a fresh id.
const buildCatalog = ({ now = new Date(), newId }) => {
  const movies = MOVIES.map(({ color, releaseOffsetDays, ...movie }) => ({
    _id: newId(),
    ...movie,
    releaseDate: new Date(now.getTime() + releaseOffsetDays * DAY_MS),
    posterUrl: poster(movie.title, color),
  }));

  const theatres = [];
  const screens = [];
  const screenPricing = new Map();
  THEATRES.forEach((config) => {
    const theatre = { _id: newId(), name: config.name, city: config.city, address: config.address };
    theatres.push(theatre);
    config.screens.forEach((screenConfig) => {
      const screen = { _id: newId(), theatre: theatre._id, name: screenConfig.name, layout: { rows: buildLayout(screenConfig) } };
      screens.push(screen);
      screenPricing.set(String(screen._id), screenConfig.pricing);
    });
  });

  const nowShowing = movies.filter((movie) => movie.status === MOVIE_STATUS.NOW_SHOWING);
  const shows = [];
  screens.forEach((screen, screenIndex) => {
    const pricing = screenPricing.get(String(screen._id));
    for (let day = 0; day < SHOW_DAYS; day += 1) {
      SLOTS.forEach((slot, slotIndex) => {
        const startsAt = istDateTime(day, slot.hour, slot.minute, now);
        if (startsAt.getTime() < now.getTime() + 30 * 60 * 1000) return; // skip shows that are about to start or already started
        const movie = nowShowing[(screenIndex * 2 + day + slotIndex * 3) % nowShowing.length];
        shows.push({
          _id: newId(),
          movie: movie._id,
          theatre: screen.theatre,
          screen: screen._id,
          startsAt,
          endsAt: computeEndsAt(startsAt, movie),
          pricing: { STANDARD: pricing.STANDARD + slot.extra, PREMIUM: pricing.PREMIUM + slot.extra },
          isActive: true,
        });
      });
    }
  });

  // One seat document per seat. A scattering of seats is marked BOOKED (with no booking record)
  // purely so the seat map looks lived-in during demos.
  const screensById = new Map(screens.map((screen) => [String(screen._id), screen]));
  const seats = [];
  shows.forEach((show, showIndex) => {
    buildSeatDocs(show, screensById.get(String(show.screen))).forEach((seat) => {
      const rowIndex = seat.row.charCodeAt(0) - 65;
      if (((rowIndex + 1) * 7 + seat.number * 3 + showIndex) % 9 === 0) seat.status = SEAT_STATUS.BOOKED;
      seats.push(seat);
    });
  });

  return { movies, theatres, screens, shows, seats };
};

// Safety net: no two shows on one screen may overlap.
const assertNoOverlaps = (shows) => {
  const byScreen = new Map();
  shows.forEach((show) => {
    const key = String(show.screen);
    if (!byScreen.has(key)) byScreen.set(key, []);
    byScreen.get(key).push(show);
  });
  byScreen.forEach((list) => {
    list.sort((a, b) => a.startsAt - b.startsAt);
    for (let i = 1; i < list.length; i += 1) {
      if (list[i].startsAt < list[i - 1].endsAt) throw new Error('Seed data bug: overlapping shows on one screen');
    }
  });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const insertInChunks = async (Model, documents, size = 2000) => {
  for (let i = 0; i < documents.length; i += size) {
    // eslint-disable-next-line no-await-in-loop
    await Model.insertMany(documents.slice(i, i + size));
  }
};

// A safety lock: seeding deletes data, so it only runs when you type CONFIRM_SEED=yes on purpose.
// Set it for ONE command only. Never put it in your .env file.
const seedIsConfirmed = (env = process.env) => env.CONFIRM_SEED === 'yes';

const main = async () => {
  if (!seedIsConfirmed()) {
    console.error('\nSeeding is blocked on purpose. It DELETES all movies, theatres, screens, shows, seats, bookings and payments.');
    console.error('Nothing was changed. If you really want to seed a database that has no real data, set CONFIRM_SEED=yes for that one command.');
    process.exit(1);
  }

  if (isProduction && !process.argv.includes('--force')) {
    console.error('Refusing to seed while NODE_ENV=production. Run with --force if you really mean it.');
    process.exit(1);
  }

  await connectDB(mongoUri);
  const dbName = mongoose.connection.name;

  console.log(`\nThis will DELETE all movies, theatres, screens, shows, seats, bookings and payments`);
  console.log(`in the database "${dbName}" and create fresh sample data. Users are kept.`);
  console.log('Press Ctrl+C within 5 seconds to cancel...\n');
  await sleep(5000);

  await Promise.all(Object.values(models).map((Model) => Model.init())); // make sure all indexes exist

  console.log('Clearing old catalogue data...');
  await models.ShowSeat.deleteMany({});
  await models.Show.deleteMany({});
  await models.Booking.deleteMany({});
  await models.Payment.deleteMany({});
  await models.Screen.deleteMany({});
  await models.Theatre.deleteMany({});
  await models.Movie.deleteMany({});

  const demoPassword = process.env.SEED_USER_PASSWORD || 'DemoPass123';
  const createdUsers = [];
  for (const sample of SAMPLE_USERS) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await models.User.findOne({ email: sample.email });
    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      const passwordHash = await bcrypt.hash(demoPassword, 12);
      // eslint-disable-next-line no-await-in-loop
      await models.User.create({ ...sample, passwordHash, role: ROLES.USER });
      createdUsers.push(sample.email);
    }
  }

  const catalog = buildCatalog({ newId: () => new mongoose.Types.ObjectId() });
  assertNoOverlaps(catalog.shows);

  console.log('Inserting sample data...');
  await models.Movie.insertMany(catalog.movies);
  await models.Theatre.insertMany(catalog.theatres);
  await models.Screen.insertMany(catalog.screens);
  await models.Show.insertMany(catalog.shows);
  await insertInChunks(models.ShowSeat, catalog.seats);

  console.log('\nDone. Created:');
  console.log(`  ${catalog.movies.length} movies, ${catalog.theatres.length} theatres, ${catalog.screens.length} screens`);
  console.log(`  ${catalog.shows.length} shows with ${catalog.seats.length} seats`);
  if (createdUsers.length > 0) {
    console.log(`  demo users: ${createdUsers.join(', ')} (password: ${demoPassword})`);
  } else {
    console.log('  demo users already existed, so they were left unchanged');
  }
  console.log('\nOpen the website and refresh. Admin accounts are created separately (Phase 2E).');
};

if (require.main === module) {
  main()
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch(async (error) => {
      console.error('\nSeeding failed:', error.message);
      try { await disconnectDB(); } catch (ignore) { /* nothing to close */ }
      process.exit(1);
    });
}

module.exports = { buildCatalog, buildLayout, assertNoOverlaps, seedIsConfirmed, MOVIES, THEATRES, SLOTS, SHOW_DAYS };
