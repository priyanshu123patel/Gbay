const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
  const { username, email, phone, password, role } = req.body;

  // Check if username already exists
  db.query("SELECT * FROM users WHERE username = ? OR email = ?", [username, email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.length > 0) {
      const existingUser = result[0];
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already exists. Please choose another one." });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already registered. Please login or use another email." });
      }
    }

    const hash = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO users (username,email,phone,password_hash,role)
       VALUES (?,?,?,?,?)`,
      [username, email, phone, hash, role],
      (err) => {
        if (err) return res.status(400).json(err);
        res.json({ message: 'User registered' });
      }
    );
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body; // this can contain email OR username

  db.query(
    `SELECT * FROM users WHERE email = ? OR username = ?`,
    [email, email],
    async (err, result) => {
      if (err || result.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result[0];

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { 
          username: user.username,
          user_id: user.user_id,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        username: user.username,
        token,
        user_id: user.user_id,
        role: user.role
      });
    }
  );
};

exports.sendotp = (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  db.query(
    "INSERT INTO password_otps (phone, otp, expires_at) VALUES (?,?,?)",
    [phone, otp, expires,phone],
    () => {
      console.log("OTP:", otp);
      res.json({ message: "OTP sent" });
    }
  );
};

exports.resetPassword = async (req, res) => {
  const { phone, otp, newPassword } = req.body;

  db.query(
    `SELECT * FROM password_otps 
     WHERE phone=? AND otp=? AND expires_at > NOW()`,
    [phone, otp],
    async (err, result) => {
      if (result.length === 0)
        return res.status(400).json({ message: "Invalid or expired OTP" });

      const hash = await bcrypt.hash(newPassword, 10);

      db.query(
        "UPDATE users SET password_hash=? WHERE phone=?",
        [hash, phone],
        () => {
          db.query("DELETE FROM password_otps WHERE phone=?", [phone]);
          res.json({ message: "Password reset successful" });
        }
      );
    }
  );
};
