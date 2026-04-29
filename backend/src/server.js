require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// ─── Middleware ───
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://wa-self.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ─── Connect to MongoDB ───
connectDB();

// ─── Routes ───
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/broadcasts', require('./routes/broadcasts'));
app.use('/api/autoreplies', require('./routes/autoreplies'));
app.use('/api/messages', require('./routes/messages'));

// Webhook is public (no auth) - mounted at root level too
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified');
    return res.status(200).send(challenge);
  }
  res.status(403).send('Forbidden');
});

app.post('/webhook', require('./routes/autoreplies'));

// ─── Health check ───
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error handler ───
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start server ───
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   WhatsApp Dashboard API                 ║
  ║   Running on port ${PORT}                   ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}               ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
