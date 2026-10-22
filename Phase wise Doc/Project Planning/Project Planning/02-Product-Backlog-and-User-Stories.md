# Product Backlog and User Stories

Statuses below describe the functionality present in the inspected source snapshot; verify on the deployed app before final submission.

| ID | User story | Priority | Status / note |
|---|---|---|---|
| US-01 | As a visitor, I can register an account. | High | Implemented in source; author should re-test |
| US-02 | As a user, I can log in and log out. | High | Implemented in source; author should re-test |
| US-03 | As a user, I can browse currently showing and upcoming movies. | High | Implemented in source |
| US-04 | As a user, I can view a movie's details and showtimes. | High | Implemented in source |
| US-05 | As a user, I can inspect available seats for a show. | High | Implemented in source |
| US-06 | As a user, I can temporarily hold seats before payment. | High | Implemented in source |
| US-07 | As a user, I can simulate payment success or failure. | High | Demo-only |
| US-08 | As a user, I can view my bookings and booking details. | High | Implemented in source |
| US-09 | As a user, I can cancel an eligible booking. | Medium | Rules are implemented in service; verify scenarios |
| US-10 | As an admin, I can manage movies, theatres and screens. | High | Implemented in admin API |
| US-11 | As an admin, I can manage and activate/deactivate shows. | High | Implemented in admin API |
| US-12 | As an admin, I can search/filter bookings and cancel a booking. | Medium | Implemented in admin API |
| US-13 | As an admin, I can view dashboard statistics and users. | Medium | Implemented in admin API |
| FUT-01 | As a user, I receive an email confirmation and ticket. | Low | Future enhancement |
| FUT-02 | As a user, I pay through a real payment gateway. | Low | Future enhancement |
| FUT-03 | As a user, I can download a QR-code ticket. | Low | Future enhancement |

## Acceptance criteria
A story should be marked fully passed only after its happy path and relevant failure/edge cases are tested in the target environment.
