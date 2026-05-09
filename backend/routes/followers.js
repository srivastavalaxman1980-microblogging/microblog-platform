const express = require('express');
const { Follower, User, Notification } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { sequelize } = require('../models');
const router = express.Router();

// Follow user
router.post('/:userId/follow', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const targetUser = await User.findByPk(req.params.userId);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    const existingFollow = await Follower.findOne({
      where: {
        follower_id: req.user.id,
        following_id: req.params.userId
      }
    });
    
    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }
    
    const follow = await Follower.create({
      follower_id: req.user.id,
      following_id: req.params.userId,
      status: 'accepted'
    }, { transaction: t });
    
    // Update counts
    await User.increment('following_count', { where: { id: req.user.id }, transaction: t });
    await User.increment('followers_count', { where: { id: req.params.userId }, transaction: t });
    
    // Create notification
    await Notification.create({
      user_id: req.params.userId,
      type: 'follow',
      actor_id: req.user.id,
      content: `${req.user.username} started following you`
    }, { transaction: t });
    
    await t.commit();
    
    res.status(201).json({ message: 'Now following user', follow });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unfollow user
router.delete('/:userId/follow', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const follow = await Follower.findOne({
      where: {
        follower_id: req.user.id,
        following_id: req.params.userId
      }
    });
    
    if (!follow) {
      return res.status(400).json({ error: 'Not following this user' });
    }
    
    await follow.destroy({ transaction: t });
    
    // Update counts
    await User.decrement('following_count', { where: { id: req.user.id }, transaction: t });
    await User.decrement('followers_count', { where: { id: req.params.userId }, transaction: t });
    
    await t.commit();
    
    res.json({ message: 'Unfollowed user' });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if following
router.get('/:userId/check', authMiddleware, async (req, res) => {
  try {
    const follow = await Follower.findOne({
      where: {
        follower_id: req.user.id,
        following_id: req.params.userId
      }
    });
    
    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;