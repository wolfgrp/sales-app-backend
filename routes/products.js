// 📁 backend/routes/products.js
const express = require('express');
const router = express.Router();

// Sample product route (you can replace with actual DB later)
router.get('/', (req, res) => {
  res.json([
    { id: 1, name: 'Notebook', price: 50 },
    { id: 2, name: 'Pen', price: 10 }
  ]);
});

module.exports = router;

