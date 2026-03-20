const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const user = require('../controllers/user.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const profileUploadDir = path.join(
	__dirname,
	'../../uploads/profile'
);

fs.mkdirSync(profileUploadDir, { recursive: true });

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, profileUploadDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		if (file.mimetype && file.mimetype.startsWith('image/')) {
			return cb(null, true);
		}
		return cb(new Error('Only image files are allowed'));
	},
});

router.get('/me', auth, user.getProfile);
router.put('/me', auth, user.updateProfile);
router.put('/me/profile-image', auth, upload.single('profile_image'), user.updateProfileImage);

module.exports = router;
