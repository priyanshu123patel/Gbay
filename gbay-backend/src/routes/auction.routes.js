const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const auction = require('../controllers/auction.controller');

router.get('/list', auth, auction.listAuctions);
router.get('/:auction_id/bids', auth, auction.getAuctionBids);
router.post('/start', auth, auction.startAuction);
router.post('/bid', auth, auction.placeBid);
router.post('/end', auth, auction.endAuction);

module.exports = router;
