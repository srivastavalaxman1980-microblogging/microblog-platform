const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Reports endpoint working' });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Report submitted' });
});

module.exports = router;