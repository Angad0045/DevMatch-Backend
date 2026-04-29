# DevMatch — Backend API

> DevMatch — a developer matching platform built on intent, not just job titles.

---

## What is DevMatch?

DevMatch is a Tinder-style developer matching platform where engineers connect based on **intent** — not random discovery. Users swipe on profiles filtered by:

- 🎓 **Mentorship** — find a mentor or become one
- 🛠️ **Collaboration** — co-founders, contributors, side-project partners
- 🌐 **Open Source** — maintainers and contributors
- 💡 **Knowledge Share** — peer learning and pair programming

---

## Tech Stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| Runtime       | Node.js 20 (ES Modules)                        |
| Framework     | Express.js                                     |
| Database      | MongoDB + Mongoose ODM                         |
| Auth          | JWT (access + refresh token rotation)          |
| Real-time     | Socket.io                                      |
| Validation    | Zod                                            |
| Security      | Helmet, CORS, express-mongo-sanitize, bcryptjs |
| Rate limiting | express-rate-limit                             |
| Hosting       | Vercel (REST) · Railway (Socket.io)            |

---

## Project Structure

```
src/
├── config/
│   ├── index.js              # Env validation (Zod) — fails fast on startup
│   └── db.js                 # MongoDB connection with pooling
├── modules/                  # Feature-based modules
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   └── auth.validator.js
│   ├── users/
│   │   ├── user.routes.js
│   │   ├── user.controller.js
│   │   ├── user.service.js
│   │   ├── user.model.js
│   │   └── user.validator.js
│   ├── feed/
│   ├── swipes/
│   ├── matches/
│   └── chat/
│       ├── chat.socket.js    # Socket.io event handlers
│       ├── chat.service.js   # Shared by REST + Socket.io
│       ├── chat.model.js
│       ├── chat.routes.js
│       └── chat.controller.js
├── middleware/
│   ├── auth.middleware.js    # JWT verification
│   └── error.middleware.js   # Global error handler
├── utils/
│   ├── ApiError.js           # Custom error class
│   ├── ApiResponse.js        # Consistent response envelope
│   ├── catchAsync.js         # Async wrapper — no try/catch in controllers
│   └── tokens.js             # JWT sign + verify
├── app.js                    # Express setup (no listen)
├── server.js                 # Vercel entry — REST only, exports app, no listen()
├── socket.server.js          # Railway entry — Socket.io only, has listen()
└── server.local.js           # Local dev — REST + Socket.io combined on one port
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB Atlas account (or local MongoDB)
- npm

### 1. Clone and install

```bash
git clone https://github.com/your-username/devmatch-backend.git
cd devmatch-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/devmatch
JWT_ACCESS_SECRET=<min-32-char-random-string>
JWT_REFRESH_SECRET=<different-min-32-char-random-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_ORIGIN=http://localhost:5173
```

> Generate strong secrets with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### 3. Run in development

```bash
npm run dev
```

Server starts on `http://localhost:3000`. Verify with:

```bash
curl http://localhost:3000/health
# → {"status":"ok","env":"development","timestamp":"..."}
```

---

## API Reference

All routes are prefixed with `/api/v1`.

### Auth

| Method | Endpoint         | Auth       | Description         |
| ------ | ---------------- | ---------- | ------------------- |
| `POST` | `/auth/register` | ✗          | Create account      |
| `POST` | `/auth/login`    | ✗          | Sign in             |
| `POST` | `/auth/refresh`  | ✗ (cookie) | Rotate access token |
| `POST` | `/auth/logout`   | ✓          | Invalidate session  |

### Users

| Method   | Endpoint         | Auth | Description        |
| -------- | ---------------- | ---- | ------------------ |
| `GET`    | `/users/me`      | ✓    | Get own profile    |
| `PATCH`  | `/users/me`      | ✓    | Update own profile |
| `DELETE` | `/users/me`      | ✓    | Deactivate account |
| `GET`    | `/users/:userId` | ✓    | Get public profile |

### Feed

| Method | Endpoint | Auth | Description                  |
| ------ | -------- | ---- | ---------------------------- |
| `GET`  | `/feed`  | ✓    | Get paginated discovery feed |

**Query params:** `intent` · `skills` (comma-separated) · `experienceLevel` · `page` · `limit`

### Swipes

| Method | Endpoint  | Auth | Description                |
| ------ | --------- | ---- | -------------------------- |
| `POST` | `/swipes` | ✓    | Record a swipe (like/pass) |
| `GET`  | `/swipes` | ✓    | Get own swipe history      |

**Body:** `{ swipedId, direction: "like"|"pass", intent }`

### Matches

| Method   | Endpoint            | Auth | Description      |
| -------- | ------------------- | ---- | ---------------- |
| `GET`    | `/matches`          | ✓    | Get all matches  |
| `GET`    | `/matches/:matchId` | ✓    | Get single match |
| `DELETE` | `/matches/:matchId` | ✓    | Unmatch          |

### Chat (REST)

| Method   | Endpoint                    | Auth | Description               |
| -------- | --------------------------- | ---- | ------------------------- |
| `GET`    | `/chat/:matchId/messages`   | ✓    | Paginated message history |
| `DELETE` | `/chat/messages/:messageId` | ✓    | Soft delete own message   |

---

## Socket.io Events

Connect with `{ auth: { token: accessToken } }`.

| Client → Server | Payload                  | Server → Client  | Payload                                     |
| --------------- | ------------------------ | ---------------- | ------------------------------------------- |
| `join:match`    | `{ matchId }`            | `join:match:ack` | `{ matchId }`                               |
| `leave:match`   | `{ matchId }`            | `message:new`    | `{ _id, matchId, sender, text, createdAt }` |
| `message:send`  | `{ matchId, text }`      | `typing:start`   | `{ userId, displayName }`                   |
| `typing:start`  | `{ matchId }`            | `typing:stop`    | `{ userId }`                                |
| `typing:stop`   | `{ matchId }`            | `message:read`   | `{ messageId, userId }`                     |
| `message:read`  | `{ matchId, messageId }` | `user:online`    | `{ userId }`                                |
| —               | —                        | `user:offline`   | `{ userId }`                                |
| —               | —                        | `error`          | `{ message }`                               |

---

## Authentication Flow

```
Register/Login
  → Issues accessToken (15m) + refreshToken (7d)
  → refreshToken stored as bcrypt hash on User document
  → refreshToken sent as httpOnly Secure SameSite=Strict cookie

Every request
  → Authorization: Bearer <accessToken>

Token expired (401)
  → POST /auth/refresh (cookie sent automatically)
  → New accessToken issued, refreshToken rotated

Logout
  → refreshTokenHash cleared from DB
  → Cookie cleared
  → Even a copied token becomes invalid
```

---

## Security

- **Helmet.js** — sets 11 security-related HTTP headers
- **CORS** — restricted to `CLIENT_ORIGIN` only
- **Rate limiting** — 100 req/15min globally, 10 req/hr on auth routes
- **NoSQL injection** — `express-mongo-sanitize` strips `$` and `.` from inputs
- **Mass assignment** — Zod `.strict()` rejects unknown fields
- **Password hashing** — bcrypt cost factor 12
- **Refresh token** — stored as bcrypt hash, never plaintext
- **Timing-safe login** — same bcrypt path for wrong email or wrong password
- **Ownership checks** — every DB query filters by `req.user._id`
- **Payload limit** — `express.json({ limit: '10kb' })`

---

## Data Models

### User

```
email · passwordHash · refreshTokenHash · profile{
  displayName · bio · avatarUrl · githubHandle · skills[] · experienceLevel · timezone
} · intent[] · isActive · lastSeenAt
```

### Swipe

```
swiper → User · swiped → User · direction(like|pass) · intent
Unique index: (swiper, swiped) — prevents duplicate swipes at DB level
```

### Match

```
users[User, User] · intent · isActive · lastMessageAt
Auto-created when mutual like detected in swipe service
```

### Message

```
matchId → Match · sender → User · text · readBy[User] · deletedAt(soft delete)
```

---

## Deployment

### REST API → Vercel

```json
// vercel.json
{
  "version": 2,
  "builds": [{ "src": "src/app.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/app.js" }]
}
```

Add all environment variables in the Vercel dashboard.

### Socket.io Server → Railway

Vercel's serverless functions cannot maintain persistent WebSocket connections. Deploy `src/server.js` to Railway or Render as a persistent Node.js process.

1. Connect your GitHub repo to Railway
2. Set start command: `node src/server.js`
3. Add all environment variables in the Railway dashboard
4. Update `CLIENT_ORIGIN` to your frontend's production URL

---

## Scripts

## Scripts

​`bash
npm run dev           # Local dev — REST + Socket.io on one port (server.local.js)
npm start             # Vercel production — REST API only (server.js)
npm run start:socket  # Railway production — Socket.io only (socket.server.js)
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier
​`

---

## Environment Variables

| Variable             | Required | Default | Description                              |
| -------------------- | -------- | ------- | ---------------------------------------- |
| `NODE_ENV`           | ✓        | —       | `development` · `staging` · `production` |
| `PORT`               | —        | `3000`  | Server port                              |
| `MONGODB_URI`        | ✓        | —       | MongoDB connection string                |
| `JWT_ACCESS_SECRET`  | ✓        | —       | Min 32 characters                        |
| `JWT_REFRESH_SECRET` | ✓        | —       | Min 32 characters, different from access |
| `JWT_ACCESS_EXPIRY`  | —        | `15m`   | Access token TTL                         |
| `JWT_REFRESH_EXPIRY` | —        | `7d`    | Refresh token TTL                        |
| `CLIENT_ORIGIN`      | ✓        | —       | Frontend URL for CORS                    |

---

## Architecture Decisions

**Why feature-based modules?**
Each feature (auth, users, feed, swipes, matches, chat) owns its routes, controller, service, and model. Changing a feature touches one directory, not four.

**Why separate REST and Socket.io servers?**
Vercel's serverless model terminates processes after each request — WebSockets require persistent connections. REST stays on Vercel (auto-scaling, zero config); Socket.io runs on Railway (persistent process, same MongoDB).

**Why store a hash of the refresh token?**
If the database leaks, raw refresh tokens would let an attacker impersonate every user. A bcrypt hash is useless without the original value — same principle as password hashing.

**Why Zod over Joi or express-validator?**
Zod schemas are pure functions reusable across the service layer without Express being present. `.strict()` blocks mass assignment at the schema level.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit using conventional commits: `feat(auth): add google oauth`
4. Push and open a Pull Request

Pre-commit hooks (Husky + lint-staged) run ESLint and Prettier automatically.

---

## License

MIT © DevMatch
