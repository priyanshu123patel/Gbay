require('dotenv').config();
const app = require('./src/app');
const passport = require("passport");
const session = require("express-session");
require('./src/config/passport');

app.use(
  session({
    secret: process.env.SESSION_SECRET || "gbay-secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", require("./src/routes/auth.routes"));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown and error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});