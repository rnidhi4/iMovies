# Functional Test Cases

**Initial status:** Pending verification unless you personally run the test and record the result. Update each status after testing.

| ID | Test | Expected result | Status |
|---|---|---|---|
| TC-01 | Register with valid details | Account created and success feedback shown | Pending |
| TC-02 | Register with invalid/missing fields | Validation message shown; account not created | Pending |
| TC-03 | Login with valid credentials | User is authenticated | Pending |
| TC-04 | Login with incorrect credentials | Safe error shown; no authenticated session | Pending |
| TC-05 | Logout | Session cookie is cleared / user is logged out | Pending |
| TC-06 | Browse movie list | Movies and status/filter results load | Pending |
| TC-07 | Open movie details | Selected movie information appears | Pending |
| TC-08 | View showtimes | Available shows are listed for the selected movie | Pending |
| TC-09 | Open seat layout | Seat statuses and prices are shown | Pending |
| TC-10 | Hold available seats | Hold and expiry details are returned | Pending |
| TC-11 | Attempt to hold unavailable seats | Request is rejected safely | Pending |
| TC-12 | Complete demo payment successfully | Booking becomes confirmed | Pending |
| TC-13 | Simulate payment failure | Failure is handled and seat/booking state remains consistent | Pending |
| TC-14 | View My Bookings | Only the signed-in user's bookings appear | Pending |
| TC-15 | Cancel eligible booking | Status and demo-refund information update according to rules | Pending |
| TC-16 | Open admin route as ordinary user | Access is denied | Pending |
| TC-17 | Create/update a movie as admin | Valid data is saved and appears in catalogue | Pending |
| TC-18 | Create/update a show as admin | Valid show is saved and listed | Pending |
| TC-19 | Search/filter admin bookings | Results reflect selected filters | Pending |
| TC-20 | Wait for an unpaid hold to expire | Expired hold is released by cleanup logic | Pending |

## Test summary
Executed: ___  Passed: ___  Failed: ___  Blocked: ___  Pending: 20
