iMovies – Movie Ticket Booking System

iMovies is a full-stack movie ticket booking web application built using the MERN stack. Users can browse movies, view showtimes, select seats, book tickets through a demo payment flow, and manage their bookings. Administrators can manage movies, theatres, screens, shows, and bookings.

Features

Customer Features

- User registration and login
- Browse currently showing and upcoming movies
- View movie details and available showtimes
- Select seats and create ticket bookings
- Demo payment success and failure flow
- View upcoming, past, and cancelled bookings
- Cancel eligible bookings according to the cancellation rules
- View booking details and status

Admin Features

- View dashboard statistics
- Add, edit, and delete movies
- Add, edit, and delete theatres
- Add and delete screens
- Add, edit, and activate or deactivate shows
- View, search, and filter bookings
- Cancel bookings with a demo refund
- View registered users

Tech Stack

- Frontend: React, Vite, JavaScript, Bootstrap 5, React Router, Axios
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT stored in an HTTP-only cookie
- Security: Password hashing, request validation, Helmet, and rate limiting
- Other Libraries: React-Toastify, React Icons, bcryptjs, express-validator
- Tools: Git, GitHub, Visual Studio Code

Project Structure

imovies/
├── client/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       └── utils/
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   ├── scripts/
│   ├── .env.example
│   └── package.json
├── docs/
└── README.md

Getting Started

Prerequisites

- Node.js 18 or later
- MongoDB database, such as MongoDB Atlas
- npm

1. Clone the repository

Replace "rnidhi4" with your GitHub username.

git clone https://github.com/rnidhi4/iMovies.git
cd iMovies

2. Install dependencies

Install the frontend dependencies:

cd client
npm install

Install the backend dependencies:

cd ../server
npm install

3. Configure environment variables

In the "server" folder, copy ".env.example" to ".env" and fill in the required values.

Required backend variables:

Variable| Purpose
"MONGODB_URI"| MongoDB connection string
"JWT_SECRET"| Secret used for signing JWTs; use a strong secret of at least 32 characters
"CLIENT_URL"| Frontend URL, usually "http://localhost:5173"

Optional backend variables include "PORT", "HOLD_MINUTES", "MAX_SEATS_PER_BOOKING", "JWT_EXPIRES_DAYS", "COOKIE_SECURE", and "COOKIE_SAME_SITE".

The frontend can optionally use "VITE_API_URL". By default, the API URL is "http://localhost:5000/api/v1".

Never commit ".env" files or real credentials to GitHub.

4. Start the backend

Open a terminal in the "server" folder:

npm run dev

The backend normally runs on "http://localhost:5000".

Health check: "http://localhost:5000/api/v1/health"

5. Start the frontend

Open another terminal in the "client" folder:

npm run dev

Open "http://localhost:5173" in your browser.

Production build

From the "client" folder, run:

npm run build

First Admin Account

Register a user through the application first. Then follow the project's admin-creation procedure using the backend script:

npm run create-admin

Follow the script's prompts to assign admin access to the intended account.

Booking Rules

- Seats are temporarily held while a booking is in progress. The default hold duration is 7 minutes.
- A booking supports a maximum of 8 seats by default.
- Customer cancellation and demo-refund eligibility depend on the time remaining before the show.
- Admin cancellation before a show starts uses the project's full demo-refund flow.
- Expired unpaid holds are cleaned up automatically.

Refer to the application's current implementation for the exact cancellation and refund rules.

Payment Notice

Payments are simulated for demonstration purposes only. The application does not process real payments or collect card details.

Database Seed Warning

The seed script can delete existing application data, including movies, theatres, screens, shows, seats, bookings, and payments. It is guarded by a confirmation setting, but it should never be run against a database containing data you want to keep.

Known Limitations

- Payments are simulated and do not involve a real payment gateway.
- Shows cannot be deleted through the admin interface.
- Customer show listings are limited to the upcoming 7-day window.
- Email notifications and QR-code tickets are not included.

Purpose

This project was built to practise full-stack web development, REST API integration, authentication, database operations, and booking workflows using the MERN stack.