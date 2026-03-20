const db = require("../config/db");

const restrictedWords = [
  "gun",
  "weapon",
  "drugs",
  "bomb",
  "pistol",
  "rifle"
];

module.exports = async function (req, res, next) {
  const search = req.query.q;
  if (!search) return next();

  const text = search.toLowerCase();

  const found = restrictedWords.find(word =>
    text.includes(word)
  );

  if (!found) return next();

  const userId = req.user.user_id;

  await db.query(
    "INSERT INTO reported_users (user_id, searched_keyword) VALUES (?, ?)",
    [userId, search]
  );

  await db.query(
    "UPDATE users SET is_locked = 1 WHERE user_id = ?",
    [userId]
  );

  return res.status(403).json({
    message: "Account locked due to restricted search"
  });
};
