const db = require('../config/db');

const pool = db.promise();

async function ensureReportedProductsTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS reported_products (
      report_id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      reporter_id INT NULL,
      reason VARCHAR(255) NOT NULL,
      status ENUM('open', 'warned', 'resolved') DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_reported_product_id (product_id),
      INDEX idx_reported_status (status)
    )`
  );
}

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, username, email, role, is_verified, is_locked, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const [users] = await pool.query(
      `SELECT user_id, username, email, phone, role, is_verified, is_locked, created_at
       FROM users
       WHERE user_id = ?`,
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [productStats] = await pool.query(
      `SELECT
        COUNT(*) AS totalListed,
        SUM(CASE WHEN is_sold = 0 THEN 1 ELSE 0 END) AS activeListings
       FROM products
       WHERE seller_id = ?`,
      [userId]
    );

    const [orderStats] = await pool.query(
      `SELECT
        SUM(CASE WHEN buyer_id = ? THEN 1 ELSE 0 END) AS totalPurchases,
        SUM(CASE WHEN seller_id = ? THEN 1 ELSE 0 END) AS totalSales,
        SUM(CASE WHEN buyer_id = ? THEN final_price ELSE 0 END) AS totalSpent,
        SUM(CASE WHEN seller_id = ? THEN final_price ELSE 0 END) AS totalEarned
       FROM orders`,
      [userId, userId, userId, userId]
    );

    const [recentPurchases] = await pool.query(
      `SELECT o.order_id, o.final_price, o.order_status, o.created_at, p.title
       FROM orders o
       JOIN products p ON p.product_id = o.product_id
       WHERE o.buyer_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [userId]
    );

    const [recentSales] = await pool.query(
      `SELECT o.order_id, o.final_price, o.order_status, o.created_at, p.title
       FROM orders o
       JOIN products p ON p.product_id = o.product_id
       WHERE o.seller_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      user: users[0],
      metrics: {
        totalListed: Number(productStats[0]?.totalListed || 0),
        activeListings: Number(productStats[0]?.activeListings || 0),
        totalPurchases: Number(orderStats[0]?.totalPurchases || 0),
        totalSales: Number(orderStats[0]?.totalSales || 0),
        totalSpent: Number(orderStats[0]?.totalSpent || 0),
        totalEarned: Number(orderStats[0]?.totalEarned || 0)
      },
      recentPurchases,
      recentSales
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user details', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    if (userId === req.user.user_id) {
      return res.status(400).json({ message: 'Admin cannot delete own account' });
    }

    const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    if (userId === req.user.user_id) {
      return res.status(400).json({ message: 'Admin cannot block own account' });
    }

    const [result] = await pool.query(
      'UPDATE users SET is_locked = 1 WHERE user_id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to block user', error: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const [result] = await pool.query(
      'UPDATE users SET is_locked = 0 WHERE user_id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unblock user', error: error.message });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { role } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    if (!['customer', 'business'].includes(role)) {
      return res.status(400).json({ message: 'Role must be customer or business' });
    }

    const [result] = await pool.query(
      'UPDATE users SET role = ? WHERE user_id = ?',
      [role, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role', error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        p.product_id,
        p.title,
        p.description,
        p.category,
        p.fixed_price,
        p.sale_mode,
        p.image_path,
        p.is_sold,
        p.created_at,
        p.seller_id,
        u.username AS seller_name,
        u.email AS seller_email,
        u.role AS seller_role
      FROM products p
      JOIN users u ON u.user_id = p.seller_id
      ORDER BY p.created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

exports.getProductDetails = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!productId) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const [rows] = await pool.query(
      `SELECT
        p.*,
        u.username AS seller_name,
        u.email AS seller_email,
        u.phone AS seller_phone,
        u.role AS seller_role
      FROM products p
      JOIN users u ON u.user_id = p.seller_id
      WHERE p.product_id = ?`,
      [productId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = rows[0];
    const images = typeof product.image_path === 'string' && product.image_path.length
      ? product.image_path.split(',').map((img) => img.trim()).filter(Boolean)
      : [];

    res.json({ ...product, images });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product details', error: error.message });
  }
};

exports.disableProductListing = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!productId) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const [result] = await pool.query(
      'UPDATE products SET is_sold = 1 WHERE product_id = ?',
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product listing disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to disable listing', error: error.message });
  }
};

exports.enableProductListing = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!productId) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const [result] = await pool.query(
      'UPDATE products SET is_sold = 0, buyer_id = NULL WHERE product_id = ?',
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product listing enabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to enable listing', error: error.message });
  }
};

exports.removeProduct = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!productId) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const [result] = await pool.query('DELETE FROM products WHERE product_id = ?', [productId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await ensureReportedProductsTable();
    await pool.query(
      `UPDATE reported_products
       SET status = 'resolved'
       WHERE product_id = ? AND status <> 'resolved'`,
      [productId]
    );

    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove product', error: error.message });
  }
};

exports.getMarketplaceStats = async (req, res) => {
  try {
    const [[totalProducts]] = await pool.query('SELECT COUNT(*) AS totalProducts FROM products');
    const [[activeListings]] = await pool.query('SELECT COUNT(*) AS activeListings FROM products WHERE is_sold = 0');
    const [[totalUsers]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[totalOrders]] = await pool.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[blockedUsers]] = await pool.query('SELECT COUNT(*) AS blockedUsers FROM users WHERE is_locked = 1');
    await ensureReportedProductsTable();
    const [[openReports]] = await pool.query(
      "SELECT COUNT(*) AS openReports FROM reported_products WHERE status IN ('open', 'warned')"
    );

    res.json({
      totalProducts: totalProducts.totalProducts,
      activeListings: activeListings.activeListings,
      totalUsers: totalUsers.totalUsers,
      totalOrders: totalOrders.totalOrders,
      blockedUsers: blockedUsers.blockedUsers,
      openReports: openReports.openReports
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch marketplace stats', error: error.message });
  }
};

exports.getMarketplaceActivity = async (req, res) => {
  try {
    const [recentProducts] = await pool.query(
      `SELECT product_id, title, created_at
       FROM products
       ORDER BY created_at DESC
       LIMIT 10`
    );

    const [recentOrders] = await pool.query(
      `SELECT o.order_id, o.final_price, o.order_status, o.created_at, p.title
       FROM orders o
       JOIN products p ON p.product_id = o.product_id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    const [recentInterests] = await pool.query(
      `SELECT pi.interest_id, pi.product_id, pi.buyer_id, pi.offered_price, pi.interest_time,
              p.title,
              u.username AS buyer_name
       FROM product_interests pi
       JOIN products p ON p.product_id = pi.product_id
       JOIN users u ON u.user_id = pi.buyer_id
       ORDER BY pi.interest_time DESC
       LIMIT 10`
    );

    res.json({ recentProducts, recentOrders, recentInterests });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch marketplace activity', error: error.message });
  }
};

exports.getReportedProducts = async (req, res) => {
  try {
    await ensureReportedProductsTable();

    const [rows] = await pool.query(
      `SELECT
        rp.report_id,
        rp.reason,
        rp.status,
        rp.created_at,
        p.product_id,
        p.title,
        p.image_path,
        p.fixed_price,
        u.user_id AS seller_id,
        u.username AS seller_name,
        u.email AS seller_email
      FROM reported_products rp
      JOIN products p ON p.product_id = rp.product_id
      JOIN users u ON u.user_id = p.seller_id
      ORDER BY rp.created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reported products', error: error.message });
  }
};

exports.reportProduct = async (req, res) => {
  try {
    const { product_id, reason } = req.body;
    const productId = Number(product_id);

    if (!productId || !reason || !String(reason).trim()) {
      return res.status(400).json({ message: 'product_id and reason are required' });
    }

    await ensureReportedProductsTable();

    const [productRows] = await pool.query(
      'SELECT product_id FROM products WHERE product_id = ?',
      [productId]
    );

    if (!productRows.length) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [result] = await pool.query(
      `INSERT INTO reported_products (product_id, reporter_id, reason, status)
       VALUES (?, ?, ?, 'open')`,
      [productId, req.user.user_id, String(reason).trim()]
    );

    res.json({ message: 'Product reported successfully', report_id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to report product', error: error.message });
  }
};

exports.warnSeller = async (req, res) => {
  try {
    const reportId = Number(req.params.reportId);
    if (!reportId) {
      return res.status(400).json({ message: 'Invalid report id' });
    }

    await ensureReportedProductsTable();

    const [rows] = await pool.query(
      `SELECT rp.report_id, rp.product_id, p.title, p.seller_id
       FROM reported_products rp
       JOIN products p ON p.product_id = rp.product_id
       WHERE rp.report_id = ?`,
      [reportId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Reported product not found' });
    }

    const report = rows[0];

    await pool.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES (?, ?, ?)`,
      [
        report.seller_id,
        'Listing Warning',
        `Your product \"${report.title}\" was reported and flagged by admin. Please review your listing details.`
      ]
    );

    await pool.query(
      `UPDATE reported_products
       SET status = 'warned'
       WHERE report_id = ?`,
      [reportId]
    );

    res.json({ message: 'Seller warned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to warn seller', error: error.message });
  }
};

exports.removeFakeListing = async (req, res) => {
  try {
    const reportId = Number(req.params.reportId);
    if (!reportId) {
      return res.status(400).json({ message: 'Invalid report id' });
    }

    await ensureReportedProductsTable();

    const [rows] = await pool.query(
      'SELECT product_id FROM reported_products WHERE report_id = ?',
      [reportId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Reported product not found' });
    }

    const productId = rows[0].product_id;

    await pool.query('DELETE FROM products WHERE product_id = ?', [productId]);
    await pool.query(
      `UPDATE reported_products
       SET status = 'resolved'
       WHERE report_id = ?`,
      [reportId]
    );

    res.json({ message: 'Fake listing removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove fake listing', error: error.message });
  }
};

exports.getPurchaseHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        o.order_id,
        o.product_id,
        o.final_price,
        o.order_status,
        o.created_at,
        p.title,
        p.image_path,
        buyer.user_id AS buyer_id,
        buyer.username AS buyer_name,
        buyer.email AS buyer_email,
        seller.user_id AS seller_id,
        seller.username AS seller_name,
        seller.email AS seller_email
      FROM orders o
      JOIN products p ON p.product_id = o.product_id
      JOIN users buyer ON buyer.user_id = o.buyer_id
      JOIN users seller ON seller.user_id = o.seller_id
      ORDER BY o.created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch purchase history', error: error.message });
  }
};

exports.getAllAuctions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        a.auction_id,
        a.product_id,
        a.start_price,
        a.current_price,
        a.start_time,
        a.end_time,
        a.status,
        a.created_by,
        p.title,
        p.image_path,
        p.seller_id,
        u.username AS seller_name,
        COALESCE((SELECT COUNT(*) FROM bids b WHERE b.auction_id = a.auction_id), 0) AS bid_count,
        COALESCE((SELECT COUNT(*) FROM product_interests pi WHERE pi.product_id = a.product_id), 0) AS interested_count
      FROM auctions a
      JOIN products p ON p.product_id = a.product_id
      JOIN users u ON u.user_id = p.seller_id
      ORDER BY
        CASE a.status
          WHEN 'active' THEN 1
          WHEN 'pending' THEN 2
          ELSE 3
        END,
        a.start_time DESC`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch auctions', error: error.message });
  }
};

exports.getAuctionBids = async (req, res) => {
  try {
    const auctionId = Number(req.params.auctionId);
    if (!auctionId) {
      return res.status(400).json({ message: 'Invalid auction id' });
    }

    const [auctionRows] = await pool.query(
      `SELECT a.auction_id, a.product_id, p.title
       FROM auctions a
       JOIN products p ON p.product_id = a.product_id
       WHERE a.auction_id = ?
       LIMIT 1`,
      [auctionId]
    );

    if (!auctionRows.length) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    const [bids] = await pool.query(
      `SELECT
        b.bid_id,
        b.bidder_id,
        u.username AS bidder_name,
        u.email AS bidder_email,
        b.bid_amount,
        b.bid_time
      FROM bids b
      JOIN users u ON u.user_id = b.bidder_id
      WHERE b.auction_id = ?
      ORDER BY b.bid_amount DESC, b.bid_time ASC`,
      [auctionId]
    );

    res.json({ auction: auctionRows[0], bids });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch auction bids', error: error.message });
  }
};
