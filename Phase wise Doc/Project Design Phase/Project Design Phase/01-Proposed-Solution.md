# Proposed Solution

iMovies combines a React-based user interface, an Express REST API and a MongoDB database. Customers can browse movies, find showtimes, select seats and manage bookings. The backend tracks seat status and temporary holds. A simulated payment flow demonstrates confirmation and failure handling without processing real money.

Administrators use protected endpoints to manage catalogue records, show schedules, users and bookings. Request validation, role checks and database indexes support data consistency.

## Main modules
- Authentication and user profile
- Movie catalogue and showtime discovery
- Theatre/screen/seat layout
- Booking and seat-hold management
- Demo payment
- Admin dashboard and management
