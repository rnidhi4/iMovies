# Performance Test Plan and Results

## Current status
No measured performance results were supplied with the source snapshot. Therefore, no latency, throughput, Lighthouse or load-test numbers are claimed here.

## Manual measurements
1. Open Chrome DevTools → Network.
2. Reload the deployed home page.
3. Record the main document load and key API request durations.
4. Repeat at least three times and record each result.
5. Run Lighthouse in Chrome DevTools for Performance and Accessibility; record the scores and test date.
6. If load testing is performed, document tool, concurrency, duration, endpoint and environment.

## Results table — fill after testing

| Measurement | Run 1 | Run 2 | Run 3 | Notes |
|---|---:|---:|---:|---|
| Home page load (ms) | — | — | — | |
| `GET /api/v1/movies` (ms) | — | — | — | |
| Movie details request (ms) | — | — | — | |
| Show seat request (ms) | — | — | — | |
| Lighthouse Performance score | — | — | — | |
| Lighthouse Accessibility score | — | — | — | |

## Design-level performance considerations
- MongoDB indexes support common lookup and uniqueness requirements.
- Pagination utilities are present in the backend source.
- Client loading/error states help communicate slow or failed requests.
- These observations are design-level only; they do not prove a particular speed or capacity.
