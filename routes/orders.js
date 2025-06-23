// 📁 backend/routes/orders.js
const express = require('express');
const router = express.Router();
const { submitOrder, getAllOrders } = require('../controllers/orderController');

router.post('/submit', submitOrder);
router.get('/all', getAllOrders);

module.exports = router;
