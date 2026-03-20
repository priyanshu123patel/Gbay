const db = require('../config/db');

const pool = db.promise();

async function createNotificationIfMissing(userId, title, message) {
  const [existing] = await pool.query(
    `SELECT id FROM notifications WHERE user_id = ? AND title = ? AND message = ? LIMIT 1`,
    [userId, title, message]
  );

  if (existing.length > 0) {
    return;
  }

  await pool.query(
    `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
    [userId, title, message]
  );
}

async function notifyAuctionStartingSoon(auctionId, productId, title, startTime, sellerId) {
  const [buyers] = await pool.query(
    `SELECT DISTINCT buyer_id FROM product_interests WHERE product_id = ?`,
    [productId]
  );

  const startLabel = new Date(startTime).toLocaleString();
  const notifTitle = 'Auction Starting Soon';
  const notifMessage = `Auction #${auctionId} for ${title} starts at ${startLabel}.`;

  await createNotificationIfMissing(sellerId, notifTitle, notifMessage);

  for (const buyer of buyers) {
    await createNotificationIfMissing(buyer.buyer_id, notifTitle, notifMessage);
  }
}

async function notifyAuctionStarted(auctionId, productId, title, sellerId) {
  const [buyers] = await pool.query(
    `SELECT DISTINCT buyer_id FROM product_interests WHERE product_id = ?`,
    [productId]
  );

  const notifTitle = 'Auction Started';
  const notifMessage = `Auction #${auctionId} for ${title} is now live. Place your bids now.`;

  await createNotificationIfMissing(sellerId, notifTitle, notifMessage);

  for (const buyer of buyers) {
    await createNotificationIfMissing(buyer.buyer_id, notifTitle, notifMessage);
  }
}

async function getAuctionLeaderboard(auctionId) {
  const [ranking] = await pool.query(
    `SELECT
       pi.buyer_id AS bidder_id,
       u.username,
       pi.offered_price,
       COALESCE(MAX(b.bid_amount), pi.offered_price) AS bid_amount,
       MAX(b.bid_time) AS bid_time
     FROM auctions a
     JOIN product_interests pi ON pi.product_id = a.product_id
     JOIN users u ON u.user_id = pi.buyer_id
     LEFT JOIN bids b ON b.auction_id = a.auction_id AND b.bidder_id = pi.buyer_id
     WHERE a.auction_id = ?
     GROUP BY pi.buyer_id, u.username, pi.offered_price
     ORDER BY bid_amount DESC, bid_time ASC, pi.offered_price DESC, pi.buyer_id ASC`,
    [auctionId]
  );

  return ranking;
}

async function finalizeAuctionOutcome(auctionId) {
  const [auctionRows] = await pool.query(
    `SELECT
       a.auction_id,
       a.product_id,
       a.start_price,
       a.current_price,
       a.status,
       a.end_time,
       p.title,
       p.seller_id,
       p.buyer_id,
       p.is_sold
     FROM auctions a
     JOIN products p ON p.product_id = a.product_id
     WHERE a.auction_id = ?
     LIMIT 1`,
    [auctionId]
  );

  if (auctionRows.length === 0) {
    return { found: false };
  }

  const auction = auctionRows[0];
  const ranking = await getAuctionLeaderboard(auctionId);

  if (ranking.length === 0) {
    await pool.query(
      `UPDATE auctions SET status = 'ended' WHERE auction_id = ?`,
      [auctionId]
    );

    return {
      found: true,
      sold: false,
      auction,
      winner: null,
    };
  }

  const winner = ranking[0];
  const finalPrice = Number(winner.bid_amount);

  await pool.query(
    `UPDATE auctions SET status = 'ended', current_price = ?, buyer_id = ? WHERE auction_id = ?`,
    [finalPrice, winner.bidder_id, auctionId]
  );

  await pool.query(
    `UPDATE products SET buyer_id = ?, is_sold = TRUE WHERE product_id = ?`,
    [winner.bidder_id, auction.product_id]
  );

  await pool.query(
    `UPDATE product_interests
     SET status = CASE
       WHEN buyer_id = ? THEN 'accepted'
       ELSE 'rejected'
     END
     WHERE product_id = ?`,
    [winner.bidder_id, auction.product_id]
  );

  const [orderRows] = await pool.query(
    `SELECT order_id FROM orders WHERE product_id = ? LIMIT 1`,
    [auction.product_id]
  );

  if (orderRows.length === 0) {
    await pool.query(
      `INSERT INTO orders (product_id, buyer_id, seller_id, final_price)
       VALUES (?,?,?,?)`,
      [auction.product_id, winner.bidder_id, auction.seller_id, finalPrice]
    );
  } else {
    await pool.query(
      `UPDATE orders
       SET buyer_id = ?, seller_id = ?, final_price = ?
       WHERE product_id = ?`,
      [winner.bidder_id, auction.seller_id, finalPrice, auction.product_id]
    );
  }

  const productTitle = auction.title || `Item ${auction.product_id}`;
  const formattedPrice = `Rs ${finalPrice.toLocaleString('en-IN')}`;

  await createNotificationIfMissing(
    winner.bidder_id,
    'Auction Won',
    `You bought ${productTitle} for ${formattedPrice}.`
  );

  await createNotificationIfMissing(
    auction.seller_id,
    'Item Sold',
    `${productTitle} sold to ${winner.username} for ${formattedPrice}.`
  );

  for (const participant of ranking.slice(1)) {
    await createNotificationIfMissing(
      participant.bidder_id,
      'Auction Result',
      `Your offer for ${productTitle} was not selected because a higher bid won the auction.`
    );
  }

  return {
    found: true,
    sold: true,
    auction,
    winner: {
      bidder_id: winner.bidder_id,
      username: winner.username,
      bid_amount: finalPrice,
    },
  };
}

async function syncAuctionStates() {
  const [pendingToStart] = await pool.query(
    `SELECT a.auction_id, a.product_id, a.created_by, a.start_time, p.title
     FROM auctions a
     JOIN products p ON p.product_id = a.product_id
     WHERE a.status = 'pending' AND a.start_time <= NOW()`
  );

  for (const auction of pendingToStart) {
    await pool.query(
      `UPDATE auctions SET status = 'active' WHERE auction_id = ?`,
      [auction.auction_id]
    );

    await notifyAuctionStarted(
      auction.auction_id,
      auction.product_id,
      auction.title || `Item ${auction.product_id}`,
      auction.created_by
    );
  }

  const [endingSoon] = await pool.query(
    `SELECT a.auction_id, a.product_id, a.created_by, a.start_time, p.title
     FROM auctions a
     JOIN products p ON p.product_id = a.product_id
     WHERE a.status = 'pending'
       AND a.start_time > NOW()
       AND TIMESTAMPDIFF(MINUTE, NOW(), a.start_time) <= 10`
  );

  for (const auction of endingSoon) {
    await notifyAuctionStartingSoon(
      auction.auction_id,
      auction.product_id,
      auction.title || `Item ${auction.product_id}`,
      auction.start_time,
      auction.created_by
    );
  }

  const [endedAuctions] = await pool.query(
    `SELECT auction_id
     FROM auctions
     WHERE status IN ('pending', 'active') AND end_time <= NOW()`
  );

  for (const auction of endedAuctions) {
    await finalizeAuctionOutcome(auction.auction_id);
  }
}

exports.startAuction = (req, res) => {
  const { product_id, start_price, start_time, end_time, auction_date } = req.body;
  const seller_id = req.user.user_id;

  db.query(
    `SELECT seller_id, sale_mode FROM products WHERE product_id = ?`,
    [product_id],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(404).json({ message: 'Product not found' });

      const product = result[0];

      if (product.seller_id !== seller_id)
        return res.status(403).json({ message: 'Not authorized' });

      if (product.sale_mode !== 'auction')
        return res.status(400).json({ message: 'Not auction product' });

      const formatted_start = `${auction_date} ${start_time}:00`;
      const formatted_end = `${auction_date} ${end_time}:00`;

      db.query(
        `SELECT COALESCE(MAX(offered_price), 0) AS highest_interest
         FROM product_interests
         WHERE product_id = ?`,
        [product_id],
        (interestErr, interestRows) => {
          if (interestErr) {
            return res.status(500).json({ message: 'Database error', error: interestErr });
          }

          const highestInterest = Number(interestRows[0]?.highest_interest || 0);
          const openingPrice = Math.max(Number(start_price), highestInterest);

          db.query(
            `INSERT INTO auctions
             (product_id, start_price, current_price, start_time, end_time, created_by, auction_date, status)
             VALUES (?,?,?,?,?,?,?,?)`,
            [product_id, start_price, openingPrice, formatted_start, formatted_end, seller_id, auction_date, 'pending'],
            (insertErr) => {
              if (insertErr) return res.status(500).json({ message: 'Database error', error: insertErr });
              res.json({ message: 'Auction started' });
            }
          );
        }
      );
    }
  );
};

exports.placeBid = async (req, res) => {
  const { auction_id, bid_amount } = req.body;
  const bidder_id = req.user.user_id;

  try {
    await syncAuctionStates();

    const [auctionRows] = await pool.query(
      `SELECT a.*, p.title, p.seller_id
       FROM auctions a
       JOIN products p ON p.product_id = a.product_id
       WHERE a.auction_id = ?`,
      [auction_id]
    );

    if (auctionRows.length === 0) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    const auction = auctionRows[0];
    const now = Date.now();
    const startMs = new Date(auction.start_time).getTime();
    const endMs = new Date(auction.end_time).getTime();

    if (now < startMs) {
      return res.status(400).json({ message: 'Auction has not started yet' });
    }

    if (now >= endMs || auction.status === 'ended') {
      return res.status(400).json({ message: 'Auction already ended' });
    }

    if (auction.seller_id === bidder_id) {
      return res.status(400).json({ message: 'Seller cannot bid on own auction' });
    }

    const [interestRows] = await pool.query(
      `SELECT interest_id FROM product_interests WHERE product_id = ? AND buyer_id = ? LIMIT 1`,
      [auction.product_id, bidder_id]
    );

    if (interestRows.length === 0) {
      return res.status(403).json({ message: 'Only interested buyers can place bids' });
    }

    const numericBid = Number(bid_amount);

    if (Number.isNaN(numericBid)) {
      return res.status(400).json({ message: 'Invalid bid amount' });
    }

    const [priceRows] = await pool.query(
      `SELECT GREATEST(
         ?,
         COALESCE((SELECT MAX(offered_price) FROM product_interests WHERE product_id = ?), 0),
         COALESCE((SELECT MAX(bid_amount) FROM bids WHERE auction_id = ?), 0)
       ) AS highest_offer`,
      [auction.start_price, auction.product_id, auction_id]
    );

    const highestOffer = Number(priceRows[0]?.highest_offer || auction.start_price);

    if (numericBid < Number(auction.start_price)) {
      return res.status(400).json({ message: 'Bid cannot be below base price' });
    }

    if (numericBid <= highestOffer) {
      return res.status(400).json({ message: 'Bid must be greater than the current highest offer' });
    }

    await pool.query(
      `INSERT INTO bids (auction_id, bidder_id, bid_amount)
       VALUES (?,?,?)`,
      [auction_id, bidder_id, numericBid]
    );

    await pool.query(
      `UPDATE auctions SET current_price = ?, status = 'active' WHERE auction_id = ?`,
      [numericBid, auction_id]
    );

    return res.json({ message: 'Bid placed' });
  } catch (err) {
    return res.status(500).json({ message: 'Database error', error: err });
  }
};

exports.listAuctions = async (req, res) => {
  const userId = req.user.user_id;

  try {
    await syncAuctionStates();

    const [rows] = await pool.query(
      `SELECT
         a.auction_id,
         a.product_id,
         a.start_price,
         GREATEST(
           a.current_price,
           COALESCE((SELECT MAX(pi2.offered_price) FROM product_interests pi2 WHERE pi2.product_id = a.product_id), 0)
         ) AS current_price,
         a.start_time,
         a.end_time,
         a.status,
         a.created_by,
         p.title,
         p.description,
         p.fixed_price,
         p.image_path,
         p.seller_id,
         u.username AS seller_name,
         CASE WHEN pi.buyer_id IS NULL THEN 0 ELSE 1 END AS is_interested,
         COALESCE(
           (SELECT COUNT(*) FROM product_interests x WHERE x.product_id = a.product_id),
           0
         ) AS interested_count,
         COALESCE(
           (SELECT COUNT(*) FROM bids b WHERE b.auction_id = a.auction_id),
           0
         ) AS bid_count
       FROM auctions a
       JOIN products p ON p.product_id = a.product_id
       JOIN users u ON u.user_id = p.seller_id
       LEFT JOIN product_interests pi ON pi.product_id = a.product_id AND pi.buyer_id = ?
       ORDER BY a.start_time ASC`
      ,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch auctions', error: err });
  }
};

exports.getAuctionBids = async (req, res) => {
  const { auction_id } = req.params;

  try {
    await syncAuctionStates();

    const [auctionRows] = await pool.query(
      `SELECT auction_id FROM auctions WHERE auction_id = ?`,
      [auction_id]
    );

    if (auctionRows.length === 0) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    const ranking = await getAuctionLeaderboard(auction_id);

    return res.json(ranking);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch bids', error: err });
  }
};

exports.endAuction = async (req, res) => {
  const { auction_id } = req.body;

  try {
    const result = await finalizeAuctionOutcome(auction_id);

    if (!result.found) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (!result.sold) {
      return res.json({ message: 'Auction ended with no qualifying buyers', winner: null });
    }

    return res.json({ message: 'Auction ended', winner: result.winner });
  } catch (err) {
    return res.status(500).json({ message: 'Database error', error: err });
  }
};
