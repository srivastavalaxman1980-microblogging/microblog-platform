const express = require('express');
const router = express.Router();

router.get('/trending', (req, res) => {
  res.json({ message: 'Trending hashtags' });
});

router.get('/:tag', (req, res) => {
  res.json({ message: `Posts for hashtag ${req.params.tag}` });
});

module.exports = router;