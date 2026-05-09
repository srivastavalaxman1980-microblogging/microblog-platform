const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Analytics endpoint working' });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Analytics logged' });
});

module.exports = router;