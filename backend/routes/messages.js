const express = require('express');
const { Message, User } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { sequelize } = require('../models');
const router = express.Router();

// Get conversations
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { sender_id: req.user.id },
          { receiver_id: req.user.id }
        ]
      },
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'full_name', 'avatar_url'] }
      ]
    });
    
    // Group by conversation
    const conversations = new Map();
    messages.forEach(msg => {
      const otherUser = msg.sender_id === req.user.id ? msg.receiver : msg.sender;
      const key = otherUser.id;
      
      if (!conversations.has(key) || conversations.get(key).created_at < msg.created_at) {
        conversations.set(key, {
          user: otherUser,
          last_message: msg,
          unread_count: !msg.read_at && msg.receiver_id === req.user.id ? 1 : 0
        });
      }
    });
    
    res.json(Array.from(conversations.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages between users
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { sender_id: req.user.id, receiver_id: req.params.userId },
          { sender_id: req.params.userId, receiver_id: req.user.id }
        ]
      },
      order: [['created_at', 'ASC']],
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'full_name', 'avatar_url'] }
      ]
    });
    
    // Mark messages as read
    await Message.update(
      { read_at: new Date() },
      {
        where: {
          sender_id: req.params.userId,
          receiver_id: req.user.id,
          read_at: null
        }
      }
    );
    
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
router.post('/:userId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    
    const message = await Message.create({
      sender_id: req.user.id,
      receiver_id: req.params.userId,
      content
    });
    
    const messageWithSender = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'full_name', 'avatar_url'] }]
    });
    
    res.status(201).json(messageWithSender);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete message
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.sender_id === req.user.id) {
      await message.update({ is_deleted_for_sender: true });
    } else if (message.receiver_id === req.user.id) {
      await message.update({ is_deleted_for_receiver: true });
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;