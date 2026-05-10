require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sequelize, User, Post, Comment, Follower, Notification } = require('./models');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('./middleware/upload');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ============ CORS CONFIGURATION ============
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3000',
  'https://microblog-frontend.onrender.com',
  'https://microblog-frontend-k7mj.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('🚫 CORS Allowed Origins:');
allowedOrigins.forEach(origin => console.log(`   - ${origin}`));

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('❌ CORS blocked:', origin);
      return callback(new Error('CORS blocked'), false);
    }
    console.log('✅ CORS allowed:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ SOCKET.IO ============
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

const userSockets = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      userSockets.set(decoded.id, socket.id);
      socket.userId = decoded.id;
      console.log(`✅ User ${decoded.id} authenticated on socket`);
    } catch (err) {
      console.error('Socket auth error:', err);
    }
  });
  
  socket.on('disconnect', () => {
    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`🔌 User ${socket.userId} disconnected`);
    }
  });
});

// Helper: send real-time notification
const sendNotification = async (userId, notification) => {
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit('notification', notification);
  }
  await Notification.create({
    user_id: userId,
    type: notification.type,
    actor_id: notification.actor_id,
    post_id: notification.post_id,
    comment_id: notification.comment_id,
    content: notification.content
  });
};

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
console.log('Cloudinary configured:', !!process.env.CLOUDINARY_CLOUD_NAME);
console.log('========================\n');

// ============ HEALTH & ROOT ============
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), port: PORT });
});

app.get('/', (req, res) => {
  res.json({
    message: 'MicroBlog API is running',
    version: '2.0.0',
    status: 'active',
    endpoints: {
      health: 'GET /health',
      auth: 'POST /api/auth/register, POST /api/auth/login',
      posts: 'GET /api/posts/feed, POST /api/posts, PUT /api/posts/:id, DELETE /api/posts/:id',
      upload: 'POST /api/upload, POST /api/upload/multiple, DELETE /api/upload/:publicId',
      notifications: 'GET /api/notifications, PUT /api/notifications/:id/read'
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
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});
// ============ AUTHENTICATION ============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }
    const existingUser = await User.findOne({ 
      where: { [require('sequelize').Op.or]: [{ username }, { email }] } 
    });
    if (existingUser) return res.status(400).json({ error: 'Username or email already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username, email, password_hash: hashedPassword, full_name: full_name || username
    });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    await user.update({ last_login_at: new Date() });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name, role: user.role } });
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
    if (!user) return res.status(404).json({ error: 'User not found' });
    const postCount = await Post.count({ where: { user_id: user.id, is_deleted: false } });
    let isFollowing = false;
    if (req.user.id !== user.id) {
      const followExists = await Follower.findOne({ where: { follower_id: req.user.id, following_id: user.id, status: 'accepted' } });
      isFollowing = !!followExists;
    }
    const recentPosts = await Post.findAll({
      where: { user_id: user.id, is_deleted: false },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    res.json({
      user: { ...user.toJSON(), post_count: postCount, followers_count: user.followers_count || 0, following_count: user.following_count || 0 },
      isFollowing, recentPosts
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
    await user.update({ full_name, bio, location, website, avatar_url, cover_photo_url });
    const updatedUser = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash'] } });
    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:userId/follow', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });
    const targetUser = await User.findByPk(userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    const existing = await Follower.findOne({ where: { follower_id: req.user.id, following_id: userId } });
    if (existing && existing.status === 'accepted') return res.status(400).json({ error: 'Already following' });
    await Follower.upsert({ follower_id: req.user.id, following_id: userId, status: 'accepted' });
    await targetUser.increment('followers_count');
    await User.increment('following_count', { where: { id: req.user.id } });
    await sendNotification(userId, {
      type: 'follow', actor_id: req.user.id,
      content: `${req.user.username} started following you`,
      actor_name: req.user.full_name || req.user.username
    });
    res.json({ message: 'Now following', isFollowing: true });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:userId/follow', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const follow = await Follower.findOne({ where: { follower_id: req.user.id, following_id: userId } });
    if (!follow) return res.status(400).json({ error: 'Not following' });
    await follow.destroy();
    await User.decrement('followers_count', { where: { id: userId } });
    await User.decrement('following_count', { where: { id: req.user.id } });
    res.json({ message: 'Unfollowed', isFollowing: false });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/followers', auth, async (req, res) => {
  try {
    const followers = await Follower.findAll({
      where: { following_id: req.params.userId, status: 'accepted' },
      include: [{ model: User, as: 'follower', attributes: ['id', 'username', 'full_name', 'avatar_url'] }]
    });
    res.json(followers.map(f => f.follower));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/following', auth, async (req, res) => {
  try {
    const following = await Follower.findAll({
      where: { follower_id: req.params.userId, status: 'accepted' },
      include: [{ model: User, as: 'following', attributes: ['id', 'username', 'full_name', 'avatar_url'] }]
    });
    res.json(following.map(f => f.following));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ POST ROUTES ============
app.get('/api/posts/feed', auth, async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { is_deleted: false },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url', 'role'] }],
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
    const { content, visibility = 'public', media_urls = [] } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required' });
    }
    const post = await Post.create({
      user_id: req.user.id,
      content: content.trim(),
      visibility,
      media_urls,
      likes_count: 0, comments_count: 0, shares_count: 0
    });
    await req.user.increment('posts_count');
    const postWithUser = await Post.findByPk(post.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url', 'role'] }]
    });
    res.status(201).json(postWithUser);
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ UPDATED EDIT POST (supports media_urls) ============
app.put('/api/posts/:id', auth, async (req, res) => {
  try {
    const { content, media_urls } = req.body;
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const updateData = { updated_at: new Date() };
    if (content !== undefined) updateData.content = content.trim();
    if (media_urls !== undefined) updateData.media_urls = media_urls;
    await post.update(updateData);
    const updatedPost = await Post.findByPk(post.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }]
    });
    res.json({ message: 'Post updated', post: updatedPost });
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    await post.update({ is_deleted: true, deleted_at: new Date() });
    await req.user.decrement('posts_count');
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    await post.increment('likes_count');
    const updatedPost = await Post.findByPk(req.params.id);
    if (post.user_id !== req.user.id) {
      await sendNotification(post.user_id, {
        type: 'like', actor_id: req.user.id, post_id: post.id,
        content: `${req.user.username} liked your post`,
        actor_name: req.user.full_name || req.user.username
      });
    }
    res.json({ liked: true, likes_count: updatedPost.likes_count });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ COMMENT ROUTES ============
app.get('/api/posts/:postId/comments', auth, async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { post_id: req.params.postId, is_deleted: false, parent_comment_id: null },
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
    if (!content || content.trim() === '') return res.status(400).json({ error: 'Comment content is required' });
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const comment = await Comment.create({
      user_id: req.user.id, post_id: postId, content: content.trim(), parent_comment_id: parent_comment_id || null
    });
    await post.increment('comments_count');
    if (post.user_id !== req.user.id) {
      await sendNotification(post.user_id, {
        type: 'comment', actor_id: req.user.id, post_id: post.id, comment_id: comment.id,
        content: `${req.user.username} commented on your post`,
        actor_name: req.user.full_name || req.user.username
      });
    }
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
    const comment = await Comment.findByPk(req.params.commentId, { include: [{ model: Post, as: 'post' }] });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    await comment.update({ is_deleted: true, deleted_at: new Date() });
    if (comment.post) await comment.post.decrement('comments_count');
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ IMAGE UPLOAD ROUTES ============
app.post('/api/upload', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  const result = await uploadToCloudinary(req.file.buffer);
  res.json({ success: true, url: result.secure_url, public_id: result.public_id });
});

app.post('/api/upload/multiple', auth, upload.array('images', 4), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No image files provided' });
  const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
  const results = await Promise.all(uploadPromises);
  res.json({ success: true, images: results.map(r => ({ url: r.secure_url, public_id: r.public_id })) });
});

app.delete('/api/upload/:publicId', auth, async (req, res) => {
  await deleteFromCloudinary(req.params.publicId);
  res.json({ success: true, message: 'Image deleted' });
});

// ============ NOTIFICATION ROUTES ============
/*app.get('/api/notifications', auth, async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [['created_at', 'DESC']],
    limit: 50
  });
  res.json(notifications);
});

app.put('/api/notifications/:id/read', auth, async (req, res) => {
  const notification = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  await notification.update({ is_read: true, read_at: new Date() });
  res.json({ message: 'Marked as read' });
});

app.put('/api/notifications/read-all', auth, async (req, res) => {
  await Notification.update({ is_read: true, read_at: new Date() }, { where: { user_id: req.user.id, is_read: false } });
  res.json({ message: 'All marked as read' });
});*/

// ============ TEMPORARY SEED ENDPOINT ============
app.get('/api/seed-demo-users', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    const userCount = await User.count();
    if (userCount > 0) {
      return res.json({ message: 'Users already exist. No seeding needed.' });
    }

    await User.bulkCreate([
      {
        id: uuidv4(),
        username: 'john_doe',
        email: 'john@example.com',
        password_hash: await bcrypt.hash('John123!', 10),
        full_name: 'John Doe',
        bio: 'Software developer',
        role: 'user'
      },
      {
        id: uuidv4(),
        username: 'jane_smith',
        email: 'jane@example.com',
        password_hash: await bcrypt.hash('Jane123!', 10),
        full_name: 'Jane Smith',
        bio: 'Digital marketer',
        role: 'user'
      },
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@microblog.com',
        password_hash: await bcrypt.hash('Admin123!', 10),
        full_name: 'Admin User',
        bio: 'Platform administrator',
        role: 'admin',
        verified: true
      }
    ]);

    res.json({ message: '✅ Seeded 3 demo users.' });
  } catch (error) {
    console.error('Seed error:', error);
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
    console.log('✅ Database connected');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`📝 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket enabled\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};
// TEMPORARY SEED ENDPOINT – REMOVE AFTER SEEDING
app.get('/api/seed-demo-users', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    const userCount = await User.count();
    if (userCount > 0) {
      return res.json({ message: 'Users already exist, skipping seed.' });
    }

    await User.bulkCreate([
      {
        id: uuidv4(),
        username: 'john_doe',
        email: 'john@example.com',
        password_hash: await bcrypt.hash('John123!', 10),
        full_name: 'John Doe',
        bio: 'Software developer',
        role: 'user'
      },
      {
        id: uuidv4(),
        username: 'jane_smith',
        email: 'jane@example.com',
        password_hash: await bcrypt.hash('Jane123!', 10),
        full_name: 'Jane Smith',
        bio: 'Digital marketer',
        role: 'user'
      },
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@microblog.com',
        password_hash: await bcrypt.hash('Admin123!', 10),
        full_name: 'Admin User',
        bio: 'Platform administrator',
        role: 'admin',
        verified: true
      }
    ]);

    res.json({ message: '✅ Seeded 3 demo users.' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

startServer();