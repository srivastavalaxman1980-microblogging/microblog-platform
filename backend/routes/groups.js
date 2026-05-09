const express = require('express');
const { Group, GroupMember, Post, User } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { sequelize } = require('../models');
const router = express.Router();

// Get all groups
router.get('/', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.findAll({
      where: { is_deleted: false },
      include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'full_name'] }],
      order: [['member_count', 'DESC']]
    });
    
    // Check if user is member
    const groupsWithMembership = await Promise.all(groups.map(async (group) => {
      const isMember = await GroupMember.findOne({
        where: { group_id: group.id, user_id: req.user.id }
      });
      return { ...group.toJSON(), isMember: !!isMember };
    }));
    
    res.json(groupsWithMembership);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create group
router.post('/', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { name, description, is_private } = req.body;
    
    const group = await Group.create({
      name,
      description,
      owner_id: req.user.id,
      is_private: is_private || false
    }, { transaction: t });
    
    // Add owner as member
    await GroupMember.create({
      group_id: group.id,
      user_id: req.user.id,
      role: 'admin'
    }, { transaction: t });
    
    await t.commit();
    
    res.status(201).json(group);
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join group
router.post('/:id/join', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const group = await Group.findByPk(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const existingMember = await GroupMember.findOne({
      where: { group_id: group.id, user_id: req.user.id }
    });
    
    if (existingMember) {
      return res.status(400).json({ error: 'Already a member' });
    }
    
    await GroupMember.create({
      group_id: group.id,
      user_id: req.user.id,
      role: 'member'
    }, { transaction: t });
    
    await Group.increment('member_count', { where: { id: group.id }, transaction: t });
    
    await t.commit();
    
    res.json({ message: 'Joined group successfully' });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave group
router.post('/:id/leave', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const membership = await GroupMember.findOne({
      where: { group_id: req.params.id, user_id: req.user.id }
    });
    
    if (!membership) {
      return res.status(400).json({ error: 'Not a member of this group' });
    }
    
    await membership.destroy({ transaction: t });
    await Group.decrement('member_count', { where: { id: req.params.id }, transaction: t });
    
    await t.commit();
    
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get group feed
router.get('/:id/feed', authMiddleware, async (req, res) => {
  try {
    const membership = await GroupMember.findOne({
      where: { group_id: req.params.id, user_id: req.user.id }
    });
    
    const group = await Group.findByPk(req.params.id);
    
    if (!membership && group.is_private) {
      return res.status(403).json({ error: 'This is a private group' });
    }
    
    const posts = await Post.findAll({
      where: { group_id: req.params.id, is_deleted: false },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
      order: [['created_at', 'DESC']]
    });
    
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;