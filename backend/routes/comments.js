const express = require('express');
const { Comment, Post, Notification } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get comments for a post
router.get('/post/:postId', authMiddleware, async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { post_id: req.params.postId, parent_comment_id: null, is_deleted: false },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
        { 
          model: Comment, 
          as: 'replies',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create comment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { post_id, content, parent_comment_id } = req.body;
    
    const comment = await Comment.create({
      user_id: req.user.id,
      post_id,
      content,
      parent_comment_id
    });
    
    // Update post comment count
    await Post.increment('comments_count', { where: { id: post_id } });
    
    // Create notification for post owner
    const post = await Post.findByPk(post_id);
    if (post.user_id !== req.user.id) {
      await Notification.create({
        user_id: post.user_id,
        type: 'comment',
        actor_id: req.user.id,
        post_id: post_id,
        comment_id: comment.id,
        content: `${req.user.username} commented on your post`
      });
    }
    
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }]
    });
    
    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await comment.update({ is_deleted: true, deleted_at: new Date() });
    await Post.decrement('comments_count', { where: { id: comment.post_id } });
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;