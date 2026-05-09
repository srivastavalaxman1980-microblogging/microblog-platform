const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API Keys endpoint' });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'API Key generated' });
});

module.exports = router;