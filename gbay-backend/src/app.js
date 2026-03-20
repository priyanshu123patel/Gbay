require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const auctionRoutes = require('./routes/auction.routes');
const userRoutes = require('./routes/user.routes');

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/product', require('./routes/product.routes'));
app.use('/api/order', require('./routes/order.routes'));
app.use('/api/payment', require('./routes/payment.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/auction', auctionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notification', require('./routes/notification.routes'));

app.get('/', (req, res) => {
  res.send('Backend is running');
});


module.exports = app;
