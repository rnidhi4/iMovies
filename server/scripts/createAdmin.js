/**
 * Promote an EXISTING user to admin. Safe and non-destructive:
 *  - it only changes the `role` of ONE user (found by email)
 *  - it never deletes anything and never touches movies, bookings, payments, etc.
 *  - it never asks for or prints any password
 *
 * Usage (terminal must be inside the "server" folder):
 *   node scripts/createAdmin.js
 *   node scripts/createAdmin.js your.email@example.com
 *
 * First register the account normally on the website, then run this script for that email.
 */
const readline = require('readline');
const mongoose = require('mongoose');
const { mongoUri } = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { ROLES } = require('../src/config/constants');

const ask = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

const run = async () => {
  const emailInput = (process.argv[2] || (await ask('Email of the user to make admin: '))).toLowerCase();
  if (!emailInput || !emailInput.includes('@')) {
    console.log('That does not look like an email address. Nothing was changed.');
    return;
  }

  await connectDB(mongoUri);

  const user = await User.findOne({ email: emailInput });
  if (!user) {
    console.log(`No user found with email "${emailInput}".`);
    console.log('Please register this account on the website first, then run this script again.');
    return;
  }

  if (user.role === ROLES.ADMIN) {
    console.log(`${user.email} is already an admin. Nothing was changed.`);
    return;
  }

  const answer = await ask(`Make "${user.name}" <${user.email}> an ADMIN? Type yes to confirm: `);
  if (answer.toLowerCase() !== 'yes') {
    console.log('Cancelled. Nothing was changed.');
    return;
  }

  // Only the role field of this one user is updated.
  await User.updateOne({ _id: user._id }, { $set: { role: ROLES.ADMIN } });
  console.log(`Done. ${user.email} is now an admin. Log out and log in again on the website.`);
};

run()
  .catch((error) => {
    console.error('Something went wrong:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await disconnectDB();
  });
