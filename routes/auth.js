const express = require('express');
const router = express.Router();

router.post('/salesman-login', (req, res) => {
  const { email } = req.body;
  if (email && email.endsWith('@company.com')) {
    return res.json({ success: true });
  } else {
    return res.json({ success: false });
  }
});

module.exports = router;

