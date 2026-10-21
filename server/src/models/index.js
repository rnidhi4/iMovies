// Loading every model at startup makes Mongoose build all indexes
// (including the unique ones that protect seats and bookings).
module.exports = {
  User: require('./User'),
  Movie: require('./Movie'),
  Theatre: require('./Theatre'),
  Screen: require('./Screen'),
  Show: require('./Show'),
  ShowSeat: require('./ShowSeat'),
  Booking: require('./Booking'),
  Payment: require('./Payment'),
};
