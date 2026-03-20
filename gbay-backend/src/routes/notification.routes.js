const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const notification = require('../controllers/notification.controller');

router.get('/', auth, notification.getNotifications);
router.put('/:id/read', auth, notification.markAsRead);
router.delete('/:id', auth, notification.deleteNotification);

module.exports = router;
