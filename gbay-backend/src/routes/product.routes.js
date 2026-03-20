const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const product = require('../controllers/product.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/products');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/create', auth, upload.array('images', 10), product.createProduct);

router.get('/list', product.getProducts);
router.post('/interest', auth, product.expressInterest);
router.delete('/interest/:product_id', auth, product.removeInterest);
router.post('/select-buyer', auth, product.selectBuyer);
router.get('/interests/:product_id', auth, product.listInterestedBuyers);
router.get('/:product_id/interests', auth, product.getInterestedBuyers);
router.get('/my-products', auth, product.getMyProducts);
router.get('/my-interests', auth, product.getMyInterests);

// const express = require("express");
// const router = express.Router();
const productController = require("../controllers/product.controller");

router.get("/categories", productController.getCategories);

const searchGuard = require("../middlewares/searchGuard");
// const auth = require("../middlewares/auth.middleware");

router.get(
  "/search",
  auth,
  searchGuard,
  productController.searchProducts
);

router.get('/:id', product.getProductById);

module.exports = router;

