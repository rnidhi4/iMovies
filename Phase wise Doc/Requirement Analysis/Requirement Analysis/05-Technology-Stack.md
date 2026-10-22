# Technology Stack

| Layer | Technology | Evidence in package configuration |
|---|---|---|
| Frontend UI | React 18 | `client/package.json` |
| Frontend tooling | Vite 5 | `client/package.json` |
| Routing | React Router 6 | `client/package.json` |
| HTTP client | Axios | `client/package.json` |
| UI styling | Bootstrap 5 | `client/package.json` |
| Icons and notifications | React Icons, React Toastify | `client/package.json` |
| Runtime | Node.js 18 or later | `server/package.json` engines |
| API framework | Express 4 | `server/package.json` |
| Database ODM | Mongoose 8 | `server/package.json` |
| Authentication | jsonwebtoken, bcryptjs, cookie-parser | `server/package.json` |
| Validation/security | express-validator, Helmet, express-rate-limit, CORS | `server/package.json` |
| Logging/config | Morgan, dotenv | `server/package.json` |
| Testing tools available | Jest, Supertest, mongodb-memory-server | `server/package.json` dev dependencies |
| Database | MongoDB | Project configuration and Mongoose models |

Package versions shown are declared version ranges, not necessarily the exact installed versions.
