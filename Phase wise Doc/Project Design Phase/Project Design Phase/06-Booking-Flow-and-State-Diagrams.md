# Booking Flow and State Diagrams

## Booking sequence

```mermaid
sequenceDiagram
  actor U as User
  participant F as React Frontend
  participant A as Express API
  participant S as Booking/Seat Services
  participant D as MongoDB
  participant P as Demo Payment Service
  U->>F: Select show and seats
  F->>A: POST /bookings/hold
  A->>S: Validate seats and request hold
  S->>D: Create pending booking and update seat hold
  D-->>S: Hold stored with expiry
  S-->>F: Booking/hold details
  U->>F: Choose simulated payment outcome
  F->>A: POST /payments/demo/:bookingId
  A->>P: Process demo outcome
  P->>D: Store payment and update booking/seats
  D-->>F: Payment/booking result
  F-->>U: Show confirmation or failure
```

## Simplified booking state

```mermaid
stateDiagram-v2
  [*] --> PENDING_PAYMENT
  PENDING_PAYMENT --> CONFIRMED: demo payment succeeds
  PENDING_PAYMENT --> EXPIRED: hold expires
  PENDING_PAYMENT --> CANCELLED: permitted cancellation/failure path
  CONFIRMED --> CANCELLED: eligible user/admin cancellation
  EXPIRED --> [*]
  CANCELLED --> [*]
  CONFIRMED --> [*]
```

## Notes
- Seats are temporarily held before payment.
- The default hold duration documented in the project README is 7 minutes; verify configuration before final submission.
- Payments are simulated and do not charge a real account.
- User cancellation/refund eligibility is time-dependent. Do not quote exact refund thresholds without checking the current service implementation.
