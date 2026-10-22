# Risks and Assumptions

| Risk / assumption | Impact | Mitigation |
|---|---|---|
| Demo payment may be mistaken for real payment | Financial expectations may be incorrect | Clearly label payment as simulated; do not enter real card data |
| Secret values are stored in environment variables | Exposure could permit database/API misuse | Keep `.env` untracked; rotate exposed credentials; store production values only in deployment settings |
| Seat holds may expire while a user is checking out | User may need to select seats again | Explain expiry and re-check seat availability before payment |
| Concurrent users may request the same seat | Double booking risk | Use database constraints/atomic updates and verify concurrency cases |
| Seed script can remove application data | Existing catalogue/bookings may be lost | Never run against a database containing data to preserve; inspect script and confirm target database first |
| Customer show listings use a limited future window | Later shows may not appear | Document current window and consider admin configuration in future |
| External network or free-host sleep may delay requests | Slower first request | Show loading/error states and record real measurements |
| No email/QR ticket workflow | Limited customer convenience | Keep as future enhancement |
| Project source snapshot may differ from deployed version | Documentation may become stale | Re-check code and deployment before submission |

## Assumptions
- The supplied ZIP represents the project version being documented.
- MongoDB Atlas is used for the database in the deployed setup.
- Team details, academic dates and performance results are supplied by the project owner.
