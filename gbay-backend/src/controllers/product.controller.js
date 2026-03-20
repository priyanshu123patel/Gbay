const db = require('../config/db');

exports.createProduct = (req, res) => {
  const {
    title,
    description,
    category,
    fixed_price,
    allowed_buyer_role,
    due_date,
    renew_date,
    sale_mode
  } = req.body;

  if (!title || !fixed_price)
    return res.status(400).json({ message: 'Required fields missing' });

  const seller_id = req.user.user_id;
  const image_path = req.files && req.files.length > 0
    ? req.files.map(file => `/uploads/products/${file.filename}`).join(',')
    : null;

  db.query(
    `INSERT INTO products
     (seller_id, title, description, category, fixed_price,
      allowed_buyer_role, due_date, renew_date,sale_mode, image_path)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      seller_id,
      title,
      description,
      category,
      fixed_price,
      allowed_buyer_role,
      due_date,
      renew_date,
      sale_mode,
      image_path
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Product created', product_id: result.insertId });
    }
  );
};


exports.getProducts = (req, res) => {
  db.query(
    `SELECT 
       p.product_id,
       p.seller_id,
       p.title,
       p.description,
       p.category,
       p.fixed_price,
       p.allowed_buyer_role,
       p.is_sold,
       p.created_at,
       p.image_path,
       p.sale_mode,
       u.username AS seller_name
     FROM products p
     JOIN users u ON p.seller_id = u.user_id
     ORDER BY p.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};
exports.expressInterest = (req, res) => {
  const { product_id, offered_price } = req.body;
  const buyer_id = req.user.user_id;

  db.query(
    `SELECT seller_id, sale_mode FROM products WHERE product_id = ?`,
    [product_id],
    (err, result) => {
      if (err || result.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (result[0].seller_id === buyer_id) {
        return res.status(400).json({ message: 'Cannot interest own product' });
      }

      db.query(
        `INSERT INTO product_interests (product_id, buyer_id, offered_price) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE offered_price = ?`,
        [product_id, buyer_id, offered_price, offered_price],
        (insertErr) => {
          if (insertErr) {
            return res.status(500).json({ message: 'Database error', error: insertErr });
          }

          // Notify the buyer
          db.query(
            `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
            [buyer_id, 'Interest Expressed', `You have successfully expressed interest in product ID: ${product_id}`]
          );

          // Notify the seller
          db.query(
            `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
            [result[0].seller_id, 'New Interest', `A user has expressed interest in your product ID: ${product_id}`]
          );

          res.json({ message: 'Interest expressed successfully' });
        }
      );
    }
  );
};

exports.selectBuyer = (req, res) => {
  const { product_id, buyer_id } = req.body;
  const seller_id = req.user.user_id;

  if (!product_id || !buyer_id)
    return res.status(400).json({ message: 'product_id & buyer_id required' });

  db.query(
    `SELECT seller_id FROM products WHERE product_id = ?`,
    [product_id],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(404).json({ message: 'Product not found' });

      if (result[0].seller_id !== seller_id)
        return res.status(403).json({ message: 'Not authorized' });

      db.query(
        `UPDATE products
         SET buyer_id = ?, is_sold = TRUE
         WHERE product_id = ?`,
        [buyer_id, product_id],
        () => {
          db.query(
            `UPDATE product_interests
             SET status = CASE
               WHEN buyer_id = ? THEN 'accepted'
               ELSE 'rejected'
             END
             WHERE product_id = ?`,
            [buyer_id, product_id]
          );

          // Retrieve final agreed price from product_interests to create an official order
          db.query(
            `SELECT offered_price FROM product_interests WHERE product_id = ? AND buyer_id = ?`,
            [product_id, buyer_id],
            (priceErr, priceRes) => {
              const final_price = (!priceErr && priceRes.length > 0) ? priceRes[0].offered_price : 0;
              
              db.query(
                `INSERT INTO orders (product_id, buyer_id, seller_id, final_price) VALUES (?, ?, ?, ?)`,
                [product_id, buyer_id, seller_id, final_price]
              );
            }
          );

          // Get product title and notify buyer & seller
          db.query(
            `SELECT title FROM products WHERE product_id = ?`,
            [product_id],
            (titleErr, titleRes) => {
              const pTitle = (!titleErr && titleRes.length > 0) ? titleRes[0].title : `Item ${product_id}`;
              
              // Notify accepted buyer
              db.query(
                `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
                [buyer_id, 'Interest Accepted', `Your interest was accepted! You can now proceed to buy ${pTitle} from your orders page.`]
              );

              // Notify seller
              db.query(
                `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
                [seller_id, 'Buyer Selected', `You have selected a buyer for ${pTitle}.`]
              );
            }
          );

          res.json({ message: 'Buyer selected, product sold' });
        }
      );
    }
  );
};
exports.listInterestedBuyers = (req, res) => {
  const { product_id } = req.params;
  const seller_id = req.user.user_id;

  db.query(
    `SELECT seller_id FROM products WHERE product_id = ?`,
    [product_id],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(404).json({ message: 'Product not found' });

      if (result[0].seller_id !== seller_id)
        return res.status(403).json({ message: 'Not authorized' });

      db.query(
        `SELECT 
           pi.interest_id,
           pi.offered_price,
           pi.status,
           pi.interest_time,
           u.user_id,
           u.username,
           u.email
         FROM product_interests pi
         JOIN users u ON pi.buyer_id = u.user_id
         WHERE pi.product_id = ?`,
        [product_id],
        (err2, rows) => {
          if (err2) return res.status(500).json(err2);
          res.json(rows);
        }
      );
    }
  );
};
exports.getInterestedBuyers = (req, res) => {
  const { product_id } = req.params;
  const seller_id = req.user.user_id;

  db.query(
    `SELECT seller_id FROM products WHERE product_id = ?`,
    [product_id],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(404).json({ message: 'Product not found' });

      if (result[0].seller_id !== seller_id)
        return res.status(403).json({ message: 'Not authorized' });

      db.query(
        `SELECT pi.buyer_id, pi.offered_price, pi.status, u.username, u.email
         FROM product_interests pi
         JOIN users u ON pi.buyer_id = u.user_id
         WHERE pi.product_id = ?`,
        [product_id],
        (err, buyers) => {
          if (err) return res.status(500).json(err);
          res.json(buyers);
        }
      );
    }
  );
};

exports.getMyProducts = (req, res) => {
  const seller_id = req.user.user_id;

  db.query(
    `SELECT
       p.product_id,
       p.title,
       p.description,
       p.category,
       p.fixed_price,
       p.sale_mode,
       p.is_sold,
       p.created_at,
       p.image_path,
       u.username AS buyer_name
     FROM products p
     LEFT JOIN users u ON u.user_id = p.buyer_id
     WHERE p.seller_id = ?
     ORDER BY p.created_at DESC`,
    [seller_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};

exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT DISTINCT LOWER(category) AS category FROM products"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message});
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { q, category, sort } = req.query;

    let sql = "SELECT * FROM products WHERE 1=1";
    const params = [];

    if (q) {
      sql += `
        AND (
          LOWER(title) LIKE ?
          OR LOWER(description) LIKE ?
          OR fixed_price LIKE ?
        )
      `;
      params.push(`%${q.toLowerCase()}%`);
      params.push(`%${q.toLowerCase()}%`);
      params.push(`%${q}%`);
    }

    if (category && category !== "all") {
      sql += " AND LOWER(category) = ?";
      params.push(category.toLowerCase());
    }

    if (sort === "asc") sql += " ORDER BY fixed_price ASC";
    if (sort === "desc") sql += " ORDER BY fixed_price DESC";

    const [rows] = await db.query(sql, params);
    res.json(rows);

  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
};
exports.getMyInterests = (req, res) => {
  const buyer_id = req.user.user_id;
  db.query(
    `SELECT p.*, u.username AS seller_name, pi.offered_price, pi.status as interest_status
     FROM products p
     JOIN users u ON p.seller_id = u.user_id
     JOIN product_interests pi ON p.product_id = pi.product_id
     WHERE pi.buyer_id = ?
     ORDER BY p.created_at DESC`,
    [buyer_id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};



exports.removeInterest = (req, res) => {
  const { product_id } = req.params;
  const buyer_id = req.user.user_id;

  db.query(
    `DELETE FROM product_interests WHERE product_id = ? AND buyer_id = ?`,
    [product_id, buyer_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Interest removed successfully' });
    }
  );
};

exports.getProductById = (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT p.*, u.username as seller_name FROM products p JOIN users u ON p.seller_id = u.user_id WHERE p.product_id = ?`,
    [id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) return res.status(404).json({ message: 'Product not found' });
      res.json(result[0]);
    }
  );
};

