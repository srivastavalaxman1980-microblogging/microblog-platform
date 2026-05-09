const express = require('express');
const { User, Follower, Post } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { full_name, bio, location, website, settings } = req.body;
    const user = await User.findByPk(req.params.id);
    
    await user.update({ full_name, bio, location, website, settings });
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user followers
router.get('/:id/followers', authMiddleware, async (req, res) => {
  try {
    const followers = await Follower.findAll({
      where: { following_id: req.params.id, status: 'accepted' },
      include: [{ model: User, as: 'follower', attributes: ['id', 'username', 'full_name', 'avatar_url'] }]
    });
    
    res.json(followers.map(f => f.follower));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user following
router.get('/:id/following', authMiddleware, async (req, res) => {
  try {
    const following = await Follower.findAll({
      where: { follower_id: req.params.id, status: 'accepted' },
      include: [{ model: User, as: 'following', attributes: ['id', 'username', 'full_name', 'avatar_url'] }]
    });
    
    res.json(following.map(f => f.following));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;