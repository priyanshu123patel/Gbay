const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const admin = require('../controllers/admin.controller');
const isAdmin = require('../middlewares/admin.middleware');

router.get('/users', auth, isAdmin, admin.getAllUsers);
router.get('/users/:userId', auth, isAdmin, admin.getUserDetails);
router.delete('/users/:userId', auth, isAdmin, admin.deleteUser);
router.patch('/users/:userId/block', auth, isAdmin, admin.blockUser);
router.patch('/users/:userId/unblock', auth, isAdmin, admin.unblockUser);
router.patch('/users/:userId/role', auth, isAdmin, admin.changeUserRole);

router.get('/products', auth, isAdmin, admin.getAllProducts);
router.get('/products/:productId', auth, isAdmin, admin.getProductDetails);
router.patch('/products/:productId/disable', auth, isAdmin, admin.disableProductListing);
router.patch('/products/:productId/enable', auth, isAdmin, admin.enableProductListing);
router.delete('/products/:productId', auth, isAdmin, admin.removeProduct);

router.get('/stats', auth, isAdmin, admin.getMarketplaceStats);
router.get('/activity', auth, isAdmin, admin.getMarketplaceActivity);
router.get('/reported-products', auth, isAdmin, admin.getReportedProducts);
router.post('/reported-products', auth, isAdmin, admin.reportProduct);
router.post('/reported-products/:reportId/warn-seller', auth, isAdmin, admin.warnSeller);
router.post('/reported-products/:reportId/remove-fake', auth, isAdmin, admin.removeFakeListing);

router.get('/purchase-history', auth, isAdmin, admin.getPurchaseHistory);
router.get('/orders', auth, isAdmin, admin.getPurchaseHistory);
router.get('/auctions', auth, isAdmin, admin.getAllAuctions);
router.get('/auctions/:auctionId/bids', auth, isAdmin, admin.getAuctionBids);

module.exports = router;
