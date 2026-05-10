require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, User, Post, Comment, Follower } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// ============ CORS CONFIGURATION ============
// List all allowed origins
const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003',
  
  // Production frontends (add all variants)
  'https://microblog-frontend.onrender.com',
  'https://microblog-frontend-k7mj.onrender.com',
  
  // From environment variable (for flexibility)
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('🚫 CORS Allowed Origins:');
allowedOrigins.forEach(origin => console.log(`   - ${origin}`));

// Configure CORS middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      console.log('✅ CORS: Request with no origin allowed');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS blocked: ${origin} not allowed`;
      console.log('❌', msg);
      return callback(new Error(msg), false);
    }
    
    console.log('✅ CORS allowed origin:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ ENVIRONMENT DEBUG ============
console.log('\n=== ENVIRONMENT CHECK ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  const urlParts = process.env.DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
  if (urlParts) {
    console.log('DB Host:', urlParts[3]);
    console.log('DB Name:', urlParts[4]);
    console.log('DB User:', urlParts[1]);
  }
}
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('========================\n');

// ============ HEALTH & ROOT ENDPOINTS ============

// Health check (no /api prefix for easy monitoring)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(), 
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'MicroBlog API is running',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      health: 'GET /health',
      auth: 'POST /api/auth/register, POST /api/auth/login',
      posts: 'GET /api/posts/feed, POST /api/posts, PUT /api/posts/:id, DELETE /api/posts/:id',
      comments: 'GET /api/posts/:postId/comments, POST /api/posts/:postId/comments',
      users: 'GET /api/users/:identifier, PUT /api/users/profile, POST /api/users/:userId/follow'
    }
  });
});

// ============ AUTH MIDDLEWARE ============
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ AUTHENTICATION ROUTES ============

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }
    
    const existingUser = await User.findOne({ 
      where: { [require('sequelize').Op.or]: [{ username }, { email }] } 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      full_name: full_name || username
    });
    
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        full_name: user.full_name,
        role: user.role
      } 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    await user.update({ last_login_at: new Date() });
    
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        full_name: user.full_name,
        role: user.role
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ USER PROFILE ROUTES ============

app.get('/api/users/:identifier', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    let user;
    if (isUUID) {
      user = await User.findByPk(identifier, { attributes: { exclude: ['password_hash'] } });
    } else {
      user = await User.findOne({ where: { username: identifier }, attributes: { exclude: ['password_hash'] } });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const postCount = await Post.count({ where: { user_id: user.id, is_deleted: false } });
    
    let isFollowing = false;
    if (req.user.id !== user.id) {
      const followExists = await Follower.findOne({
        where: { follower_id: req.user.id, following_id: user.id, status: 'accepted' }
      });
      isFollowing = !!followExists;
    }
    
    const recentPosts = await Post.findAll({
      where: { user_id: user.id, is_deleted: false },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    res.json({ 
      user: { 
        ...user.toJSON(), 
        post_count: postCount,
        followers_count: user.followers_count || 0,
        following_count: user.following_count || 0
      }, 
      isFollowing, 
      recentPosts 
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/profile', auth, async (req, res) => {
  try {
    const { full_name, bio, location, website, avatar_url, cover_photo_url } = req.body;
    const user = await User.findByPk(req.user.id);
    
    await user.update({
      full_name: full_name || user.full_name,
      bio: bio || user.bio,
      location: location || user.location,
      website: website || user.website,
      avatar_url: avatar_url || user.avatar_url,
      cover_photo_url: cover_photo_url || user.cover_photo_url
    });
    
    const updatedUser = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash'] } });
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:userId/follow', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const existingFollow = await Follower.findOne({
      where: { follower_id: req.user.id, following_id: userId }
    });
    
    if (existingFollow && existingFollow.status === 'accepted') {
      return res.status(400).json({ error: 'Already following this user' });
    }
    
    await Follower.upsert({ follower_id: req.user.id, following_id: userId, status: 'accepted' });
    await targetUser.increment('followers_count');
    await User.increment('following_count', { where: { id: req.user.id } });
    
    res.json({ message: 'Now following user', isFollowing: true });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:userId/follow', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const follow = await Follower.findOne({
      where: { follower_id: req.user.id, following_id: userId }
    });
    
    if (!follow) {
      return res.status(400).json({ error: 'Not following this user' });
    }
    
    await follow.destroy();
    await User.decrement('followers_count', { where: { id: userId } });
    await User.decrement('following_count', { where: { id: req.user.id } });
    
    res.json({ message: 'Unfollowed user', isFollowing: false });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/followers', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await Follower.findAll({
      where: { following_id: userId, status: 'accepted' },
      include: [{ model: User, as: 'follower', attributes: ['id', 'username', 'full_name', 'avatar_url', 'bio'] }]
    });
    res.json(followers.map(f => f.follower));
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/following', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await Follower.findAll({
      where: { follower_id: userId, status: 'accepted' },
      include: [{ model: User, as: 'following', attributes: ['id', 'username', 'full_name', 'avatar_url', 'bio'] }]
    });
    res.json(following.map(f => f.following));
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ POST ROUTES ============

app.get('/api/posts/feed', auth, async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { is_deleted: false },
      include: [{ 
        model: User, 
        as: 'user', 
        attributes: ['id', 'username', 'full_name', 'avatar_url', 'role'] 
      }],
      order: [['created_at', 'DESC']],
      limit: 50
    });
    
    res.json({ posts, count: posts.length });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/posts', auth, async (req, res) => {
  try {
    const { content, visibility = 'public' } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (content.length > 280) {
      return res.status(400).json({ error: 'Content cannot exceed 280 characters' });
    }
    
    const now = new Date();
    const post = await Post.create({
      user_id: req.user.id,
      content: content.trim(),
      visibility: visibility,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: now,
      updated_at: now
    });
    
    await req.user.increment('posts_count');
    
    const postWithUser = await Post.findByPk(post.id, {
      include: [{ 
        model: User, 
        as: 'user', 
        attributes: ['id', 'username', 'full_name', 'avatar_url', 'role'] 
      }]
    });
    
    res.status(201).json(postWithUser);
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/posts/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (content.length > 280) {
      return res.status(400).json({ error: 'Content cannot exceed 280 characters' });
    }
    
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await post.update({ content: content.trim(), updated_at: new Date() });
    
    const updatedPost = await Post.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url', 'role'] }]
    });
    
    res.json({ message: 'Post updated successfully', post: updatedPost });
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await post.update({ is_deleted: true, deleted_at: new Date() });
    await req.user.decrement('posts_count');
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    await post.increment('likes_count');
    const updatedPost = await Post.findByPk(req.params.id);
    
    res.json({ liked: true, likes_count: updatedPost.likes_count });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ COMMENT ROUTES ============

app.get('/api/posts/:postId/comments', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.findAll({
      where: { post_id: postId, is_deleted: false, parent_comment_id: null },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
        { model: Comment, as: 'replies', where: { is_deleted: false }, required: false, include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/posts/:postId/comments', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parent_comment_id } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const comment = await Comment.create({
      user_id: req.user.id,
      post_id: postId,
      content: content.trim(),
      parent_comment_id: parent_comment_id || null
    });
    
    await post.increment('comments_count');
    
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }]
    });
    
    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/comments/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findByPk(commentId, { include: [{ model: Post, as: 'post' }] });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await comment.update({ is_deleted: true, deleted_at: new Date() });
    
    if (comment.post) {
      await comment.post.decrement('comments_count');
    }
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ 404 & ERROR HANDLERS ============

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============ START SERVER ============

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`📝 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API base: /api\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();