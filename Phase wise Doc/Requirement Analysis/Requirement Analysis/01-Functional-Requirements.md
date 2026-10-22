# Functional Requirements

| ID | Requirement | Relevant API group |
|---|---|---|
| FR-01 | A visitor can register an account. | `POST /api/v1/auth/register` |
| FR-02 | A user can log in and log out. | `POST /api/v1/auth/login`, `POST /api/v1/auth/logout` |
| FR-03 | An authenticated user can retrieve their current profile. | `GET /api/v1/auth/me` |
| FR-04 | Visitors can browse/filter movies and view movie details. | `GET /api/v1/movies`, `GET /api/v1/movies/:id` |
| FR-05 | A visitor can view a movie's showtimes. | `GET /api/v1/movies/:id/shows` |
| FR-06 | A visitor can view theatres. | `GET /api/v1/theatres` |
| FR-07 | A visitor can view show details and seat availability. | `GET /api/v1/shows/:id`, `GET /api/v1/shows/:id/seats` |
| FR-08 | An authenticated user can hold selected seats. | `POST /api/v1/bookings/hold` |
| FR-09 | An authenticated user can view their bookings and a booking detail. | `GET /api/v1/bookings`, `GET /api/v1/bookings/:id` |
| FR-10 | An authenticated user can cancel an eligible booking. | `POST /api/v1/bookings/:id/cancel` |
| FR-11 | An authenticated user can run the demo-payment flow. | `POST /api/v1/payments/demo/:bookingId` |
| FR-12 | An admin can view statistics and users. | `GET /api/v1/admin/stats`, `GET /api/v1/admin/users` |
| FR-13 | An admin can create/update/delete movies and theatres. | `/api/v1/admin/movies`, `/api/v1/admin/theatres` |
| FR-14 | An admin can create/delete screens. | `/api/v1/admin/screens` |
| FR-15 | An admin can list, create, update and activate/deactivate shows. | `/api/v1/admin/shows` |
| FR-16 | An admin can search/filter bookings and cancel a booking. | `GET /api/v1/admin/bookings`, `POST /api/v1/admin/bookings/:id/cancel` |

All routes are mounted below `/api/v1`. Check the route files before relying on this table for an API contract; query parameters and response shapes are not fully enumerated here.
