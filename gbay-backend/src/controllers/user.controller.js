const db = require('../config/db');

exports.getProfile = (req, res) => {
  db.query(
    `SELECT user_id, username, email, phone, role, is_verified, created_at, created_at AS createdAt, profile_image
     FROM users WHERE user_id = ?`,
    [req.user.user_id],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(404).json({ message: 'User not found' });
      res.json(result[0]);
    }
  );
};

exports.updateProfile = (req, res) => {
  const { username, phone } = req.body;

  db.query(
    `UPDATE users SET username=?, phone=? WHERE user_id=?`,
    [username, phone, req.user.user_id],
    () => res.json({ message: 'Profile updated' })
  );
};

exports.updateProfileImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Profile image is required' });
  }

  const profileImage = `/uploads/profile/${req.file.filename}`;

  db.query(
    `UPDATE users SET profile_image = ? WHERE user_id = ?`,
    [profileImage, req.user.user_id],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to update profile image' });
      }

      return res.json({
        message: 'Profile image updated successfully',
        profile_image: profileImage,
      });
    }
  );
};

exports.reportIllegalSearch = async (userId, keyword) => {
  await db.query(
    "INSERT INTO reported_users (user_id, searched_keyword) VALUES (?, ?)",
    [userId, keyword]
  );

  await db.query(
    "UPDATE users SET is_locked = 1 WHERE user_id = ?",
    [userId]
  );
};
