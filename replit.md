# replit.md

## Overview

**Private Dialer ("منير رقم 1")** is a web-based phone dialer application that allows users to make phone calls with caller ID hiding capability via the Twilio API. Users register/login, get a starting balance of $1.00, and can place calls that deduct from their balance. The interface is in Arabic (RTL layout).

Key features:
- User registration and authentication (email/password)
- Phone dialer with numeric keypad
- Caller ID hiding option
- Call logging
- Wallet/balance system (starts at $1.00, $0.50 per call)
- Twilio integration for placing actual phone calls

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend (Node.js + Express)

- **Runtime**: Node.js with ES modules (`"type": "module"` in package.json)
- **Entry point**: `server.js` (not `index.js` which is empty)
- **Framework**: Express.js serving both API endpoints and static files
- **Port**: Defaults to 3000, configurable via `PORT` environment variable

### API Structure

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/register` | POST | Create new user account |
| `/api/login` | POST | Authenticate user, return JWT |
| `/api/call` | POST | Initiate a phone call via Twilio |

### Authentication

- **Strategy**: JWT (JSON Web Token) based authentication
- **Secret**: Configured via `JWT_SECRET` environment variable, falls back to hardcoded default
- **Password hashing**: bcrypt with 10 salt rounds
- **Token storage**: Client-side via `localStorage`

### Database

- **Engine**: SQLite3 (file-based at `./database.db`)
- **Schema**:
  - `users` table: `id` (INTEGER PK), `email` (TEXT UNIQUE), `password` (TEXT/hashed), `balance` (REAL, default 1.0)
- **Note**: No ORM is used; raw SQL queries via the `sqlite3` package directly
- **Consideration**: If migrating to PostgreSQL later, the schema is simple enough for straightforward conversion. Replace `sqlite3` with a Postgres driver and adjust query syntax (e.g., `AUTOINCREMENT` → `SERIAL`).

### Frontend

- **Architecture**: Vanilla HTML/CSS/JavaScript (no framework)
- **Pages**:
  - `public/index.html` — Login/registration page
  - `public/app.html` — Main dialer application (keypad, call logs, wallet)
- **Styling**: Custom CSS with grid-based keypad layout, RTL support for Arabic
- **Icons**: Font Awesome 6.5 (CDN)
- **State management**: Client-side variables and `localStorage` for token/balance persistence
- **Navigation**: Tab-based SPA pattern within `app.html` using CSS class toggling (`.screen.active`)

### Important Architectural Notes

1. The `server.js` file appears truncated — the register endpoint, login endpoint, and call endpoint implementations may be incomplete and need to be finished
2. The `index.js` file is empty and unused — `server.js` is the actual entry point
3. The `app.html` and `app.js` files also appear truncated (missing closing tags, nav bar, logout function body)
4. Balance tracking currently happens both client-side (in `app.js`) and server-side (in the database) — these should stay in sync
5. Twilio webhook support is partially set up (`express.urlencoded` middleware is included)

## External Dependencies

### Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token |
| `JWT_SECRET` | Secret key for signing JWTs |
| `PORT` | Server port (optional, defaults to 3000) |

### NPM Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18.2 | HTTP server and routing |
| `cors` | ^2.8.5 | Cross-origin resource sharing |
| `sqlite3` | ^5.1.6 | SQLite database driver |
| `bcrypt` | ^5.1.0 | Password hashing |
| `jsonwebtoken` | ^9.0.2 | JWT creation and verification |
| `twilio` | ^4.23.0 | Twilio API client for making calls |

### External Services

- **Twilio**: Used for placing phone calls. Requires a Twilio account with an Account SID, Auth Token, and a purchased phone number to use as the caller ID
- **Font Awesome CDN**: Used for icons in the dialer interface (loaded from `cdnjs.cloudflare.com`)