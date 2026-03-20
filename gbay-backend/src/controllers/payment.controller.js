const db = require('../config/db');

exports.payOrder = (req, res) => {
  const { order_id } = req.body;
  const buyer_id = req.user.user_id;

  db.query(
    `SELECT * FROM orders WHERE order_id = ? AND buyer_id = ?`,
    [order_id, buyer_id],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(404).json({ message: 'Order not found' });

      db.query(
        `UPDATE orders SET order_status = 'paid' WHERE order_id = ?`,
        [order_id],
        () => {
          // Notify the buyer
          db.query(
            `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
            [buyer_id, 'Purchase Successful', `Your payment for order ID: ${order_id} was successful.`]
          );

          // Notify the seller
          db.query(
            `INSERT INTO notifications (user_id, title, message)
             SELECT seller_id, 'Item Sold', CONCAT('Your item in order ID: ', ?, ' has been fully paid for and sold.')
             FROM orders WHERE order_id = ?`,
            [order_id, order_id]
          );

          res.json({ message: 'Payment successful' });
        }
      );
    }
  );
};
