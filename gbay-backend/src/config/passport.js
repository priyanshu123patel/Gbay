const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("./db");

function generateUniqueUsername(baseUsername, callback) {
  let attempt = baseUsername.replace(/\s+/g, '').toLowerCase(); // Clean up base username
  const checkUsername = (usernameToCheck) => {
    db.query("SELECT user_id FROM users WHERE username = ?", [usernameToCheck], (err, result) => {
      if (err) return callback(err);
      if (result.length === 0) {
        callback(null, usernameToCheck);
      } else {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        checkUsername(`${attempt}${randomNum}`);
      }
    });
  };
  checkUsername(attempt);
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || "http://localhost:5000"}/auth/google/callback`,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const email = profile.emails[0].value;
        const displayName = profile.displayName;

        db.query(
          "SELECT * FROM users WHERE email = ?",
          [email],
          (err, result) => {
            if (err) return done(err);

            if (result.length > 0) {
              return done(null, result[0]);
            } else {
              // Create unique username
              generateUniqueUsername(displayName, (err, uniqueUsername) => {
                if (err) return done(err);

                // Creating a new user
                db.query(
                  "INSERT INTO users (username, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
                  [uniqueUsername, email, "", "", "customer"],
                  (err, insertResult) => {
                    if (err) return done(err);
                    const newUser = {
                      user_id: insertResult.insertId,
                      username: uniqueUsername,
                      email: email,
                      role: "customer"
                    };
                    return done(null, newUser);
                  }
                );
              });
            }
          }
        );
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});