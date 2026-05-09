const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Notifications endpoint working' });
});

router.put('/:id/read', (req, res) => {
  res.json({ message: 'Notification marked as read' });
});

module.exports = router;