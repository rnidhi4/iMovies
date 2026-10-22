# API Design

Base prefix: `/api/v1`. Authentication and role requirements should be verified in the corresponding middleware/controller before publishing this table as a formal API contract.

| Method | Path | Purpose / access |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/auth/register` | Create account; rate-limited |
| POST | `/auth/login` | Log in; rate-limited |
| POST | `/auth/logout` | Log out |
| GET | `/auth/me` | Authenticated user's profile |
| GET | `/movies` | Browse/filter movies |
| GET | `/movies/:id` | Movie details |
| GET | `/movies/:id/shows` | Movie showtimes |
| GET | `/theatres` | List theatres |
| GET | `/shows/:id` | Show details |
| GET | `/shows/:id/seats` | Show seat map/status |
| GET | `/bookings` | Authenticated user's bookings |
| POST | `/bookings/hold` | Create temporary seat hold |
| GET | `/bookings/:id` | Booking details for authorised user |
| POST | `/bookings/:id/cancel` | Cancel eligible user booking |
| POST | `/payments/demo/:bookingId` | Simulated payment; authenticated and rate-limited |
| GET | `/admin/stats` | Admin dashboard statistics |
| GET | `/admin/users` | Admin user list |
| GET | `/admin/bookings` | Admin booking list/search/filter |
| POST | `/admin/bookings/:id/cancel` | Admin cancellation |
| POST | `/admin/movies` | Create movie |
| PUT | `/admin/movies/:id` | Update movie |
| DELETE | `/admin/movies/:id` | Delete movie |
| GET | `/admin/theatres` | Admin theatre list |
| POST | `/admin/theatres` | Create theatre |
| PUT | `/admin/theatres/:id` | Update theatre |
| DELETE | `/admin/theatres/:id` | Delete theatre |
| POST | `/admin/screens` | Create screen |
| DELETE | `/admin/screens/:id` | Delete screen |
| GET | `/admin/shows` | Admin show list |
| POST | `/admin/shows` | Create show |
| PUT | `/admin/shows/:id` | Update show / active state |

## General request/response notes
- Validation middleware is used for many request bodies and parameters.
- Authentication uses an HTTP-only cookie; protected routes require a valid session token.
- Exact query parameters, status codes and response examples should be copied from controllers/validators if a fully exhaustive API reference is required.
