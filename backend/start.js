const express = require('express');
const cors = require('cors');
const { sequelize, User, Post, Comment } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded = jwt.verify(token, 'secret');
    req.user = await User.findByPk(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password_hash: hashedPassword, full_name });
    const token = jwt.sign({ id: user.id, username: user.username }, 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(req.body.password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username }, 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get feed
app.get('/api/posts/feed', auth, async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name'] }],
      order: [['created_at', 'DESC']]
    });
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
app.post('/api/posts', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.create({ user_id: req.user.id, content });
    const postWithUser = await Post.findByPk(post.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name'] }]
    });
    res.status(201).json(postWithUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like post
app.post('/api/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    await post.increment('likes_count');
    res.json({ liked: true, likes_count: post.likes_count + 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comments
app.get('/api/posts/:postId/comments', auth, async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { post_id: req.params.postId, parent_comment_id: null },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'full_name'] },
        { model: Comment, as: 'replies', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name'] }] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create comment
app.post('/api/posts/:postId/comments', auth, async (req, res) => {
  try {
    const { content, parent_comment_id } = req.body;
    const comment = await Comment.create({
      user_id: req.user.id,
      post_id: req.params.postId,
      content,
      parent_comment_id
    });
    
    await Post.increment('comments_count', { where: { id: req.params.postId } });
    
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name'] }]
    });
    res.status(201).json(commentWithUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete comment
app.delete('/api/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    
    await comment.update({ is_deleted: true, deleted_at: new Date() });
    await Post.decrement('comments_count', { where: { id: comment.post_id } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

sequelize.authenticate().then(() => {
  console.log('✅ Database connected');
  app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
}).catch(err => console.error('DB error:', err));