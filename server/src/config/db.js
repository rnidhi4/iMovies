const mongoose = require('mongoose');

let transactionsAvailable = false;

mongoose.set('strictQuery', true);

// Transactions need a replica set (Atlas always is one) or a sharded cluster.
// A plain local `mongod` is "standalone" and cannot run them.
const detectTransactionSupport = async () => {
  const admin = mongoose.connection.db.admin();
  let info;
  try {
    info = await admin.command({ hello: 1 });
  } catch (error) {
    info = await admin.command({ isMaster: 1 }); // MongoDB older than 4.4.2
  }
  return Boolean(info.setName) || info.msg === 'isdbgrid';
};

const connectDB = async (uri) => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  transactionsAvailable = await detectTransactionSupport();
  // Never log the connection string: it contains your database password.
  console.log(`MongoDB connected (host: ${mongoose.connection.host}, db: ${mongoose.connection.name})`);
  console.log(
    transactionsAvailable
      ? 'Transactions: supported (replica set detected)'
      : 'Transactions: NOT supported (standalone MongoDB), using atomic updates only'
  );
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

const transactionsSupported = () => transactionsAvailable;

/**
 * Runs `work(session)` inside a transaction when supported, otherwise runs `work(null)`.
 * Mongoose accepts a null session, so callers can always pass `{ session }`.
 * The callback may be retried by MongoDB on transient errors, so keep it free of side
 * effects outside the database (no emails, no external API calls).
 */
const withTransaction = async (work) => {
  if (!transactionsAvailable) return work(null);

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = { connectDB, disconnectDB, transactionsSupported, withTransaction };
