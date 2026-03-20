const db = require('../config/db');

exports.getNotifications = (req, res) => {
  const user_id = req.user.user_id;

  db.query(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};

exports.markAsRead = (req, res) => {
  const user_id = req.user.user_id;
  const { id } = req.params;

  db.query(
    `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND id = ?`,
    [user_id, id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Notification marked as read' });
    }
  );
};

exports.deleteNotification = (req, res) => {
  const user_id = req.user.user_id;
  const { id } = req.params;

  db.query(
    `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
    [id, user_id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Notification deleted' });
    }
  );
};
