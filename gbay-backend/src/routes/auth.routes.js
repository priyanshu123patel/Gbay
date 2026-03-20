const express = require('express');
const router = express.Router();
const passport = require("passport");
const auth = require('../controllers/auth.controller');
const jwt = require('jsonwebtoken');

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=GoogleAuthFailed`,
  }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { 
        username: user.username,
        user_id: user.user_id,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );
     
    // Redirect to frontend with data on an existing route
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?token=${token}&username=${encodeURIComponent(user.username)}&user_id=${user.user_id}&role=${user.role}`);
  }
);

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/send-otp', auth.sendotp);
router.post("/reset-password", auth.resetPassword);

module.exports = router;
