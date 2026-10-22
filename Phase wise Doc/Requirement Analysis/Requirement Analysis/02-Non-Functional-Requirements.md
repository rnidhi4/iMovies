# Non-Functional Requirements

The points below describe mechanisms visible in the source; they are not a certification of security or performance.

- **Security:** password hashes are stored rather than plaintext passwords; authentication uses JWT in an HTTP-only cookie.
- **Access control:** admin routes are protected by authentication and role checks.
- **Input validation:** Express validators and shared validation middleware are used on request routes.
- **HTTP hardening:** Helmet is included in the backend.
- **Abuse control:** rate limiters are used for authentication and demo-payment routes.
- **Data integrity:** Mongoose schemas define required fields, enums and indexes. Unique indexes protect selected records such as user email, show-seat labels and payment transaction references.
- **Booking reliability:** seats have statuses and hold expiry timestamps; a sweeper service handles expired holds.
- **Maintainability:** backend code is separated into routes, controllers, services, models, middleware, validators and utilities.
- **Usability:** frontend uses loading, error and empty-state components.
- **Performance:** no measured response-time, throughput or Lighthouse score is included in this report; measurements must be collected separately.
