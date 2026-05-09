const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Ads endpoint working' });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Ad created' });
});

module.exports = router;