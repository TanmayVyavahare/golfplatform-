require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

// Initialise Express App
const app = express();

const extraAllowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // tools/curl/mobile apps may send no Origin
  if (origin.startsWith('http://localhost:')) return true;
  if (origin === process.env.CLIENT_URL) return true;
  if (extraAllowedOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow localhost, configured origins, and all Vercel preview/prod hosts.
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
const webhookRoutes = require('./routes/webhook');
app.use('/api/webhook', webhookRoutes); // Mount before express.json() for raw body parsing

app.use(express.json()); // parses json requests
// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Import Routes
const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/scores');
const drawRoutes = require('./routes/draws');
const charityRoutes = require('./routes/charities');
const profileRoutes = require('./routes/profile');
const subscriptionRoutes = require('./routes/subscriptions');
const winnerRoutes = require('./routes/winners');
const adminRoutes = require('./routes/admin');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/draws', drawRoutes); // Both public and /admin/draws can go here, or separate admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/charities', charityRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/winners', winnerRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
