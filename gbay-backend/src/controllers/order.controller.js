const db = require('../config/db');

exports.createOrder = (req, res) => {
  const { product_id } = req.body;
  const seller_id = req.user.user_id;

  db.query(
    `SELECT buyer_id, fixed_price, seller_id, is_sold
     FROM products WHERE product_id = ?`,
    [product_id],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(404).json({ message: 'Product not found' });

      const product = result[0];

      if (!product.is_sold)
        return res.status(400).json({ message: 'Product not sold yet' });

      if (product.seller_id !== seller_id)
        return res.status(403).json({ message: 'Not authorized' });

      db.query(
        `INSERT INTO orders
         (product_id, buyer_id, seller_id, final_price)
         VALUES (?,?,?,?)`,
        [product_id, product.buyer_id, seller_id, product.fixed_price],
        (err, result) => {
          if (err) return res.status(500).json(err);
          res.json({ message: 'Order created', order_id: result.insertId });
        }
      );
    }
  );
};
exports.getBuyerOrders = (req, res) => {
  const buyer_id = req.user.user_id;

  db.query(
    `SELECT
       o.order_id,
       o.product_id,
       o.final_price,
       o.order_status,
       o.created_at,
       p.title,
       p.description,
       p.image_path,
       p.category,
       p.sale_mode,
       u.username AS seller_name
     FROM orders o
     JOIN products p ON o.product_id = p.product_id
     JOIN users u ON u.user_id = o.seller_id
     WHERE o.buyer_id = ?
     ORDER BY o.created_at DESC`,
    [buyer_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};
exports.getSellerOrders = (req, res) => {
  const seller_id = req.user.user_id;

  db.query(
    `SELECT o.order_id, o.final_price, o.order_status, o.created_at,
            p.title
     FROM orders o
     JOIN products p ON o.product_id = p.product_id
     WHERE o.seller_id = ?
     ORDER BY o.created_at DESC`,
    [seller_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};
exports.cancelOrder = (req, res) => {
  const { order_id } = req.body;
  const user_id = req.user.user_id;

  db.query(
    `SELECT * FROM orders WHERE order_id = ?`,
    [order_id],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(404).json({ message: 'Order not found' });

      const order = result[0];

      if (order.order_status === 'completed')
        return res.status(400).json({ message: 'Completed order cannot be cancelled' });

      if (order.buyer_id !== user_id && order.seller_id !== user_id)
        return res.status(403).json({ message: 'Not authorized' });

      db.query(
        `UPDATE orders SET order_status = 'cancelled' WHERE order_id = ?`,
        [order_id],
        () => res.json({ message: 'Order cancelled' })
      );
    }
  );
};
