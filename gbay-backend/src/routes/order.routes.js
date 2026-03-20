const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const order = require('../controllers/order.controller');

router.post('/create', auth, order.createOrder);
router.get('/buyer-history', auth, order.getBuyerOrders);
router.get('/seller-history', auth, order.getSellerOrders);
router.post('/cancel', auth, order.cancelOrder);

module.exports = router;
