# Test Plan

## Objective
Check that important user and admin workflows behave as expected, and collect performance measurements without inventing results.

## Test environment
- Application: iMovies (MERN)
- Browser: **To be filled**
- OS/device: **To be filled**
- Backend deployment: Render (confirm current URL/version before submission)
- Frontend deployment: Render (confirm current URL/version before submission)
- Database: MongoDB Atlas (do not include credentials)

## Test categories
- Functional: registration, login, movie discovery, show details, seat selection, booking and cancellation.
- Authorization: guest/user/admin access.
- Validation: invalid inputs, missing fields, invalid IDs.
- Reliability: expired holds and repeated payment request/idempotency.
- Performance: page load, API response times and Lighthouse audit.

## Entry criteria
Application is deployed or running locally and a test account is available.

## Exit criteria
All planned cases have an observed result recorded; failed cases include evidence and a defect note.

## Evidence
Record date/time, browser, route, expected result, actual result and screenshot/console evidence. Do not mark a test Passed based only on source inspection.
