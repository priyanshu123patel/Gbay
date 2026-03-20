const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const payment = require('../controllers/payment.controller');

router.post('/pay', auth, payment.payOrder);

module.exports = router;
