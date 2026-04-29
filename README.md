# WhatsApp Dashboard — Bulk Messaging, Auto-Replies & Contact Management

I wanted to build something that lets me manage WhatsApp conversations at scale — not through some overpriced SaaS with a monthly subscription, but something I actually own. Something I built from the ground up. Backend, frontend, database, API integration — the whole thing.

This is a full-stack WhatsApp Business Dashboard. It connects to Meta's official Cloud API and gives you a clean, dark-themed control panel to manage contacts, blast out bulk messages, set up auto-reply chatbot rules, and track every conversation — all from one place.

The part that took the most thought? The broadcast system. Getting bulk messages to go out sequentially with rate-limiting so WhatsApp doesn't throttle you, while simultaneously tracking delivery status per-recipient and updating stats in real time — that's not a tutorial-level problem. But it works.

![Dashboard Preview](https://raw.githubusercontent.com/Astronomox/whatsapp-dashboard/main/frontend/src/assets/hero.png)

---

## What It Does

### Contact Management
You can add contacts individually or bulk-import them by pasting CSV data directly into the import modal. Every contact gets a name, phone number (international format), labels for grouping, notes, and a conversation status. Search across your entire contact list instantly. Labels are the backbone of targeting — tag contacts as `customer`, `vip`, `lead`, whatever you want, and use those labels to target broadcasts later.

### Bulk Messaging (Broadcasts)
Create a campaign, give it a name, pick your message type (text or template), add recipients manually or target everyone with specific labels, and hit send. The system resolves all recipients, deduplicates them, and fires messages sequentially with a configurable delay between each one to respect WhatsApp's rate limits. Every message is logged individually — you can see exactly which recipients received it, which ones failed, and why.

Template messages are required by WhatsApp for initiating conversations. Once a contact replies, a 24-hour window opens where you can send freeform text. The dashboard handles both flows.

### Auto-Replies (Chatbot)
Set up rules that automatically respond to incoming messages. Four trigger types:

- **Exact match** — message must be exactly "hello" (case-insensitive)
- **Contains** — message includes the word "price" anywhere
- **Regex** — full regex pattern matching for complex rules
- **Default** — catch-all fallback for anything that doesn't match other rules

Rules have priority levels. Higher priority rules are checked first. You can toggle rules on and off without deleting them. When a message comes in through the webhook, the auto-reply engine runs through every active rule in priority order, finds the first match, and fires the response.

### Conversations
A WhatsApp-style chat interface showing all your conversations. Click a contact to see the full message history — inbound and outbound, with timestamps and delivery status indicators. Send messages directly from the conversation view.

### Dashboard & Analytics
Four stat cards showing total sent, total received, sent today, and sent this week. A bar chart visualizing the same data. Quick snapshot of your messaging activity.

---

## The Tech Stack

### Backend
- **Node.js + Express 5** — REST API server
- **MongoDB + Mongoose 9** — database with indexed models for contacts, messages, broadcasts, auto-reply rules, and users
- **Meta WhatsApp Cloud API** — official integration for sending/receiving messages
- **JWT Authentication** — bcrypt password hashing, token-based auth with middleware
- **Webhook Handler** — receives incoming messages, processes status updates (sent → delivered → read), triggers auto-replies

### Frontend
- **React 19 + Vite** — fast dev server, instant HMR
- **React Router v7** — client-side routing with protected/public route wrappers
- **Axios** — API client with auth interceptors
- **Recharts** — dashboard charts
- **React Hot Toast** — notifications
- **React Icons** — Material Design + Font Awesome icons

### Infrastructure
- **MongoDB Atlas** — cloud-hosted database (free tier)
- **Meta Developer Platform** — WhatsApp Business API access

---

## Project Structure

```
whatsapp-dashboard/
├── backend/
│   ├── .env                          # API keys, DB connection, JWT secret
│   ├── package.json
│   └── src/
│       ├── server.js                 # Express app entry point
│       ├── config/
│       │   └── db.js                 # MongoDB connection
│       ├── middleware/
│       │   └── auth.js               # JWT verification middleware
│       ├── models/
│       │   ├── User.js               # Dashboard user accounts
│       │   ├── Contact.js            # WhatsApp contacts with labels
│       │   ├── Message.js            # Message history (in/out)
│       │   ├── Broadcast.js          # Bulk campaign configs + stats
│       │   └── AutoReply.js          # Chatbot trigger/response rules
│       ├── services/
│       │   └── whatsappService.js    # Meta Cloud API wrapper
│       └── routes/
│           ├── auth.js               # Register, login, current user
│           ├── contacts.js           # CRUD + bulk import + label queries
│           ├── broadcasts.js         # Create, send, track campaigns
│           ├── autoreplies.js        # CRUD + webhook handler
│           └── messages.js           # History, conversations, stats
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx                  # App entry point
│       ├── App.jsx                   # Router + auth provider + toaster
│       ├── index.css                 # Global styles + DM Sans font
│       ├── utils/
│       │   └── api.js                # Axios instance with JWT interceptor
│       ├── context/
│       │   └── AuthContext.jsx       # Auth state + login/register/logout
│       ├── components/
│       │   ├── Sidebar.jsx           # Navigation sidebar
│       │   └── Layout.jsx            # Sidebar + main content wrapper
│       └── pages/
│           ├── Login.jsx             # Sign in page
│           ├── Register.jsx          # Create account page
│           ├── Dashboard.jsx         # Stats cards + bar chart
│           ├── Contacts.jsx          # Contact list + add/edit/import
│           ├── Broadcasts.jsx        # Campaign cards + create/send
│           ├── AutoReplies.jsx       # Rule list + create/edit/toggle
│           └── Conversations.jsx     # Chat-style message view
│
└── .gitignore
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Sign in, get JWT token |
| GET | `/api/auth/me` | Get current user profile |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List contacts (search, label filter, pagination) |
| POST | `/api/contacts` | Create a contact |
| POST | `/api/contacts/import` | Bulk import from array |
| PUT | `/api/contacts/:id` | Update a contact |
| DELETE | `/api/contacts/:id` | Delete a contact |
| GET | `/api/contacts/labels/all` | Get all unique labels |

### Broadcasts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/broadcasts` | List all campaigns |
| POST | `/api/broadcasts` | Create a campaign |
| POST | `/api/broadcasts/:id/send` | Execute a broadcast |
| GET | `/api/broadcasts/:id` | Get campaign details + messages |
| DELETE | `/api/broadcasts/:id` | Delete a campaign |

### Auto-Replies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/autoreplies` | List all rules |
| POST | `/api/autoreplies` | Create a rule |
| PUT | `/api/autoreplies/:id` | Update a rule |
| DELETE | `/api/autoreplies/:id` | Delete a rule |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | Get messages (filter by phone) |
| GET | `/api/messages/conversations` | Get unique conversations |
| GET | `/api/messages/stats` | Dashboard statistics |

### Webhook
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhook` | Meta verification endpoint |
| POST | `/webhook` | Receive incoming messages + status updates |

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- MongoDB Atlas account (free tier works)
- Meta Developer account with WhatsApp Business API

### 1. Clone the repo

```bash
git clone https://github.com/Astronomox/whatsapp-dashboard.git
cd whatsapp-dashboard
```

### 2. Set up the backend

```bash
cd backend
pnpm install
```

Create a `.env` file (see `.env.example` for reference):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/whatsapp-dashboard?retryWrites=true&w=majority
JWT_SECRET=your_random_secret_here
JWT_EXPIRES_IN=7d
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_API_VERSION=v25.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=any_random_string
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
pnpm dev
```

### 3. Set up the frontend

```bash
cd ../frontend
pnpm install
pnpm dev
```

Open `http://localhost:5173` — register an account and you're in.

### 4. Set up WhatsApp Business API

1. Go to [developers.facebook.com](https://developers.facebook.com) → create a Business app
2. Add the "Connect with customers through WhatsApp" use case
3. Go to API Setup → copy your Access Token, Phone Number ID, and Business Account ID
4. Paste them into your `.env` file
5. Add test recipient phone numbers in the Meta console (they need to verify via OTP)
6. Send a test `hello_world` template message

### 5. Set up webhooks (optional — for receiving messages)

1. Expose your backend with ngrok: `ngrok http 5000`
2. In Meta's API Setup → Configure Webhooks
3. Callback URL: `https://your-ngrok-url.app/webhook`
4. Verify token: same value as `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your `.env`
5. Subscribe to `messages` events

---

## WhatsApp API Notes

A few things to know about the WhatsApp Business API:

- **Template messages first**: You can't send a freeform text to someone who hasn't messaged you. You must start with an approved template (like `hello_world`). Once they reply, a 24-hour conversation window opens for freeform messaging.
- **Test numbers**: The free test phone number from Meta can only send to numbers you've registered and verified as test recipients in the developer console.
- **Real phone number**: To message anyone without test recipient restrictions, add and verify your own phone number under Step 5 in Meta's API Setup. Note: that number will no longer work on regular WhatsApp — it becomes a Business API number.
- **Rate limits**: WhatsApp enforces rate limits on message sending. The broadcast system includes a configurable delay between messages (default 1 second) to stay within limits.

---

## Future Improvements

- [ ] Message scheduling with cron jobs
- [ ] Custom template creation from the dashboard
- [ ] Media message support (images, documents, audio)
- [ ] Webhook integration with ngrok auto-setup
- [ ] Contact CSV file upload (drag & drop)
- [ ] Real-time message updates via WebSocket
- [ ] Deploy backend to Railway/Render, frontend to Vercel
- [ ] Multi-user workspace support

---

## Built By

**Abdullahi Oriola** — Data Science student, University of Lagos

Built from scratch in a single session. Backend, frontend, database, API integration, deployment prep — everything.

[GitHub](https://github.com/Astronomox) · Built with Claude
