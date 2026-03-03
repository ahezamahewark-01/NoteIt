# NoteIt — AI-Powered Notes App

A full-stack MERN notes application with AI features (summarization, Q&A, tone optimization) and multi-provider authentication.

## Features

- **CRUD** — Create, read, update, and delete personal notes
- **Authentication** — Local (username/password) and Google OAuth 2.0
- **Authorization** — Notes are strictly scoped per user; session expires automatically
- **AI Summary** — Adaptive-length summarization via Gemini 2.5 Flash
- **AI Q&A** — Multi-turn conversational chat grounded to note content
- **AI Optimize** — Rewrite notes with preset or custom tone instructions
- **Split-panel popup** — View original note alongside AI panel side by side
- **Confirmation dialogs** — AlertDialog component for all destructive actions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, MUI Icons |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | Passport.js (Local + Google OAuth 2.0), express-session, bcrypt |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |

---

## Project Structure
```
NoteIt/
├── backend/
│   ├── server.js              # Express app, all routes, Passport config
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env
    └── src/
        ├── main.jsx
        ├── styles/
        │   └── index.css
        ├── services/
        │   └── api.js             # Centralized HTTP client with 401 interceptor
        └── components/
            ├── App.jsx            # Root component — owns auth state
            ├── Landing.jsx        # Login / Register page
            ├── Dashboard.jsx      # Main notes view
            ├── Header.jsx
            ├── Footer.jsx
            ├── Note.jsx           # Note card
            ├── CreateNoteForm.jsx
            ├── NotePopup.jsx      # Detail popup with AI panel
            └── AlertDialog.jsx    # Reusable confirmation dialog
```

---

## Data Models
```js
// Note — scoped to a user
{
  title:   String,
  content: String,
  userId:  ObjectId → User   // indexed; enforces per-user data isolation
  // + createdAt, updatedAt  (timestamps: true)
}

// User — supports local and Google OAuth accounts
{
  username:     String,   // unique, required
  password:     String,   // bcrypt hash; absent for Google accounts
  googleId:     String,   // absent for local accounts
  authProvider: "local" | "google"
  // + createdAt, updatedAt  (timestamps: true)
}
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally **or** a [MongoDB Atlas](https://www.mongodb.com/atlas) URI
- [Google AI Studio](https://aistudio.google.com/app/apikey) API key
- Google OAuth 2.0 credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) *(only required for Google login)*

### 1. Clone
```bash
git clone https://github.com/your-username/NoteIt.git
cd NoteIt
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env    # fill in values — see Environment Variables
npm run dev             # starts on http://localhost:3000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev             # opens at http://localhost:5173
```

---

## Environment Variables

### `backend/.env`
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/notesDB
SESSION_SECRET=replace-with-a-long-random-string

# Google AI Studio — https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSy-your-key-here

# Google OAuth — https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

CLIENT_URL=http://localhost:5173
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:3000
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/check-session` | Returns `{ success, user }` or `401` |
| `POST` | `/register` | `{ username, password }` — create local account |
| `POST` | `/login` | `{ username, password }` — start session |
| `POST` | `/logout` | Destroy session |
| `GET` | `/auth/google` | Redirect to Google OAuth consent screen |
| `GET` | `/auth/google/callback` | OAuth callback; redirects to frontend on success |

### Notes *(session required)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notes` | All notes for the authenticated user |
| `POST` | `/notes` | Create note — `{ title, content }` |
| `PUT` | `/notes/:id` | Update note — `{ title, content }` |
| `DELETE` | `/notes/:id` | Delete note |

### AI *(session required)*

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/notes/:id/summarize` | — | Adaptive-length AI summary |
| `POST` | `/notes/:id/ask` | `{ question, conversationHistory }` | Multi-turn Q&A |
| `POST` | `/notes/:id/optimize` | `{ instruction }` | Rewrite with AI instruction |

---

## Authentication Flow
```
Local login
  POST /login → Passport LocalStrategy → bcrypt.compare
  → req.logIn() → serializeUser stores user._id in session
  → browser receives: Set-Cookie: connect.sid (httpOnly, sameSite)

Google OAuth
  GET /auth/google → Google consent screen
  → GET /auth/google/callback → Passport GoogleStrategy
  → findOrCreate User { googleId, authProvider: "google" }
  → session created → redirect to CLIENT_URL

Subsequent requests
  Browser sends cookie automatically
  → express-session restores session data
  → deserializeUser fetches User from DB → req.user populated

Session expiry
  Any protected route returns 401
  → api.js interceptor fires → setUser(null) → Login screen shown
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Enable `secure: true` on session cookie (requires HTTPS)
- [ ] Replace in-memory session store with [`connect-mongo`](https://www.npmjs.com/package/connect-mongo)
- [ ] Use a strong, randomly generated `SESSION_SECRET`
- [ ] Build frontend: `npm run build` in `/frontend`, serve `dist/`
- [ ] Restrict CORS `origin` to your production domain

---
