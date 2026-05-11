require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Post,
  Comment,
  Follower,
  Notification,
  Hashtag,
  Like,
  ModerationLog,
} = require('./models');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('./middleware/upload');
const { moderateContent } = require('./utils/moderation');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ============ CORS ============
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3000',
  'https://microblog-frontend.onrender.com',
  'https://microblog-frontend-k7mj.onrender.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log('🚫 CORS Allowed Origins:');
allowedOrigins.forEach((origin) => console.log(`   - ${origin}`));

app.use(
  cors({
    origin: function (origin, callback) {
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ SOCKET.IO (real‑time) ============
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
const userSockets = new Map();

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

const sendNotification = async (userId, notification) => {
  const socketId = userSockets.get(userId);
  if (socketId) io.to(socketId).emit('notification', notification);
  await Notification.create({
    user_id: userId,
    type: notification.type,
    actor_id: notification.actor_id,
    post_id: notification.post_id,
    comment_id: notification.comment_id,
    content: notification.content,
  });
};

// ============ ENVIRONMENT DEBUG ============
console.log('\n=== ENVIRONMENT CHECK ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  const urlParts = process.env.DATABASE_URL.match(
    /postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/
  );
  if (urlParts) {
    console.log('DB Host:', urlParts[3]);
    console.log('DB Name:', urlParts[4]);
    console.log('DB User:', urlParts[1]);
  }
}
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('Cloudinary configured:', !!process.env.CLOUDINARY_CLOUD_NAME);
console.log('========================\n');

// ============ SIMPLE TEST ROUTES ============
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), port: PORT });
});
app.get('/', (req, res) => {
  res.json({
    message: 'Aureon API',
    version: '2.0.0',
    endpoints: {
      health: 'GET /health',
      auth: 'POST /api/auth/register, POST /api/auth/login',
      posts: 'GET /api/posts/feed, POST /api/posts, PUT /api/posts/:id, DELETE /api/posts/:id',
      share: 'POST /api/posts/:id/share',
      hashtags: 'GET /api/hashtags/trending, GET /api/hashtags/:tag/posts',
      upload: 'POST /api/upload, POST /api/upload/multiple, DELETE /api/upload/:publicId',
    },
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
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ AUTHENTICATION ============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'Missing fields' });
    const existing = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });
    if (existing) return res.status(400).json({ error: 'Username or email exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password_hash: hashed,
      full_name: full_name || username,
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
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
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
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ USER PROFILE & FOLLOW ============
app.get('/api/users/:identifier', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );
    const user = isUUID
      ? await User.findByPk(identifier, { attributes: { exclude: ['password_hash'] } })
      : await User.findOne({ where: { username: identifier }, attributes: { exclude: ['password_hash'] } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const postCount = await Post.count({ where: { user_id: user.id, is_deleted: false } });
    let isFollowing = false;
    if (req.user.id !== user.id) {
      const follow = await Follower.findOne({
        where: { follower_id: req.user.id, following_id: user.id, status: 'accepted' },
      });
      isFollowing = !!follow;
    }
    const recentPosts = await Post.findAll({
      where: { user_id: user.id, is_deleted: false },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      limit: 10,
    });
    res.json({
      user: {
        ...user.toJSON(),
        post_count: postCount,
        followers_count: user.followers_count || 0,
        following_count: user.following_count || 0,
      },
      isFollowing,
      recentPosts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/profile', auth, async (req, res) => {
  try {
    const { full_name, bio, location, website, avatar_url, cover_photo_url } = req.body;
    const user = await User.findByPk(req.user.id);
    await user.update({ full_name, bio, location, website, avatar_url, cover_photo_url });
    const updated = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash'] } });
    res.json({ message: 'Profile updated', user: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:userId/follow', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });
    const target = await User.findByPk(userId);
    if (!target) return res.status(404).json({ error: 'User not found' });
    const existing = await Follower.findOne({
      where: { follower_id: req.user.id, following_id: userId },
    });
    if (existing && existing.status === 'accepted')
      return res.status(400).json({ error: 'Already following' });
    await Follower.upsert({ follower_id: req.user.id, following_id: userId, status: 'accepted' });
    await target.increment('followers_count');
    await User.increment('following_count', { where: { id: req.user.id } });
    await sendNotification(userId, {
      type: 'follow',
      actor_id: req.user.id,
      content: `${req.user.username} started following you`,
    });
    res.json({ message: 'Now following', isFollowing: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:userId/follow', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const follow = await Follower.findOne({
      where: { follower_id: req.user.id, following_id: userId },
    });
    if (!follow) return res.status(400).json({ error: 'Not following' });
    await follow.destroy();
    await User.decrement('followers_count', { where: { id: userId } });
    await User.decrement('following_count', { where: { id: req.user.id } });
    res.json({ message: 'Unfollowed', isFollowing: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/followers', auth, async (req, res) => {
  const followers = await Follower.findAll({
    where: { following_id: req.params.userId, status: 'accepted' },
    include: [{ model: User, as: 'follower', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
  });
  res.json(followers.map((f) => f.follower));
});

app.get('/api/users/:userId/following', auth, async (req, res) => {
  const following = await Follower.findAll({
    where: { follower_id: req.params.userId, status: 'accepted' },
    include: [{ model: User, as: 'following', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
  });
  res.json(following.map((f) => f.following));
});

// ============ POSTS & SHARES (with moderation) ============
app.get('/api/posts/feed', auth, async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { is_deleted: false },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
        {
          model: Post,
          as: 'original',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json({ posts, count: posts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE POST – with moderation
app.post('/api/posts', auth, async (req, res) => {
  try {
    const { content, visibility = 'public', media_urls = [] } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required' });
    }

    // --- MODERATION CHECK ---
    await moderateContent(req.user.id, 'post', content, ModerationLog);
    // ------------------------

    const post = await Post.create({
      user_id: req.user.id,
      content: content.trim(),
      visibility,
      media_urls,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
    });

    // extract hashtags
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    if (matches) {
      const tagNames = matches.map((t) => t.substring(1).toLowerCase());
      for (const tagName of tagNames) {
        let hashtag = await Hashtag.findOne({ where: { tag: tagName } });
        if (!hashtag) hashtag = await Hashtag.create({ tag: tagName });
        await post.addHashtag(hashtag);
        await hashtag.increment('post_count');
      }
    }

    await req.user.increment('posts_count');
    const postWithUser = await Post.findByPk(post.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
    });
    res.status(201).json(postWithUser);
  } catch (error) {
    if (error.message.includes('violates our community guidelines')) {
      return res.status(403).json({ error: error.message });
    }
    console.error('Post error:', error);
    res.status(500).json({ error: error.message });
  }
});

// SHARE (retweet / quote) – also moderated (the share comment)
app.post('/api/posts/:id/share', auth, async (req, res) => {
  try {
    const originalPost = await Post.findByPk(req.params.id);
    if (!originalPost) return res.status(404).json({ error: 'Post not found' });
    if (originalPost.is_deleted) return res.status(400).json({ error: 'Cannot share a deleted post' });

    const { comment } = req.body;
    if (comment && comment.length > 280) {
      return res.status(400).json({ error: 'Share comment too long (max 280 chars)' });
    }

    // Moderation on share comment (if provided)
    if (comment && comment.trim()) {
      await moderateContent(req.user.id, 'post', comment, ModerationLog);
    }

    const sharePost = await Post.create({
      user_id: req.user.id,
      content: comment || '',
      shared_from: originalPost.id,
      share_comment: comment || null,
      visibility: 'public',
      media_urls: [],
    });

    await originalPost.increment('shares_count');
    await req.user.increment('posts_count');

    const shareWithDetails = await Post.findByPk(sharePost.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
        {
          model: Post,
          as: 'original',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
        },
      ],
    });

    if (originalPost.user_id !== req.user.id) {
      await sendNotification(originalPost.user_id, {
        type: 'share',
        actor_id: req.user.id,
        post_id: originalPost.id,
        content: `${req.user.username} shared your post`,
      });
    }

    res.status(201).json(shareWithDetails);
  } catch (error) {
    if (error.message.includes('violates our community guidelines')) {
      return res.status(403).json({ error: error.message });
    }
    console.error('Share error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/posts/:id', auth, async (req, res) => {
  try {
    const { content, media_urls } = req.body;
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Unauthorized' });
    const updateData = { updated_at: new Date() };
    if (content !== undefined) updateData.content = content.trim();
    if (media_urls !== undefined) updateData.media_urls = media_urls;
    await post.update(updateData);
    const updated = await Post.findByPk(post.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
    });
    res.json({ message: 'Post updated', post: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Unauthorized' });
    await post.update({ is_deleted: true, deleted_at: new Date() });
    await req.user.decrement('posts_count');
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    await post.increment('likes_count');
    const updated = await Post.findByPk(post.id);
    if (post.user_id !== req.user.id) {
      await sendNotification(post.user_id, {
        type: 'like',
        actor_id: req.user.id,
        post_id: post.id,
        content: `${req.user.username} liked your post`,
      });
    }
    res.json({ liked: true, likes_count: updated.likes_count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ COMMENTS (with moderation) ============
app.get('/api/posts/:postId/comments', auth, async (req, res) => {
  const comments = await Comment.findAll({
    where: { post_id: req.params.postId, is_deleted: false, parent_comment_id: null },
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
      {
        model: Comment,
        as: 'replies',
        where: { is_deleted: false },
        required: false,
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
      },
    ],
    order: [['created_at', 'DESC']],
  });
  res.json({ comments });
});

app.post('/api/posts/:postId/comments', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parent_comment_id } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment required' });
    }

    // --- MODERATION CHECK ---
    await moderateContent(req.user.id, 'comment', content, ModerationLog);
    // ------------------------

    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = await Comment.create({
      user_id: req.user.id,
      post_id: postId,
      content: content.trim(),
      parent_comment_id: parent_comment_id || null,
    });
    await post.increment('comments_count');
    if (post.user_id !== req.user.id) {
      await sendNotification(post.user_id, {
        type: 'comment',
        actor_id: req.user.id,
        post_id: post.id,
        comment_id: comment.id,
        content: `${req.user.username} commented on your post`,
      });
    }
    const withUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
    });
    res.status(201).json(withUser);
  } catch (error) {
    if (error.message.includes('violates our community guidelines')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/comments/:commentId', auth, async (req, res) => {
  const comment = await Comment.findByPk(req.params.commentId, { include: [{ model: Post, as: 'post' }] });
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.user_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Unauthorized' });
  await comment.update({ is_deleted: true, deleted_at: new Date() });
  if (comment.post) await comment.post.decrement('comments_count');
  res.json({ message: 'Comment deleted' });
});

// ============ HASHTAGS ============
app.get('/api/hashtags/trending', async (req, res) => {
  try {
    const trending = await Hashtag.findAll({
      attributes: ['tag', 'post_count'],
      order: [['post_count', 'DESC']],
      limit: 10,
    });
    res.json(trending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hashtags/:tag/posts', async (req, res) => {
  try {
    const { tag } = req.params;
    const hashtag = await Hashtag.findOne({ where: { tag: tag.toLowerCase() } });
    if (!hashtag) return res.json({ posts: [], count: 0, tag });
    const posts = await hashtag.getPosts({
      where: { is_deleted: false },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json({ posts, count: posts.length, tag: hashtag.tag });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ IMAGE UPLOAD ============
app.post('/api/upload', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const result = await uploadToCloudinary(req.file.buffer);
  res.json({ success: true, url: result.secure_url, public_id: result.public_id });
});

app.post('/api/upload/multiple', auth, upload.array('images', 4), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files' });
  const results = await Promise.all(req.files.map((f) => uploadToCloudinary(f.buffer)));
  res.json({ success: true, images: results.map((r) => ({ url: r.secure_url, public_id: r.public_id })) });
});

app.delete('/api/upload/:publicId', auth, async (req, res) => {
  await deleteFromCloudinary(req.params.publicId);
  res.json({ success: true });
});

// ============ NOTIFICATIONS ============
app.get('/api/notifications', auth, async (req, res) => {
  const notifs = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [['created_at', 'DESC']],
    limit: 50,
  });
  res.json(notifs);
});

app.put('/api/notifications/:id/read', auth, async (req, res) => {
  const notif = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!notif) return res.status(404).json({ error: 'Not found' });
  await notif.update({ is_read: true, read_at: new Date() });
  res.json({ message: 'Marked read' });
});

app.put('/api/notifications/read-all', auth, async (req, res) => {
  await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { user_id: req.user.id, is_read: false } }
  );
  res.json({ message: 'All marked read' });
});

// ============ ADMIN ENDPOINTS (moderation logs) ============
// Get moderation logs (admin only)
app.get('/api/admin/moderation-logs', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const logs = await ModerationLog.findAll({ order: [['created_at', 'DESC']], limit: 100 });
  res.json(logs);
});

// Mark log as reviewed (admin only)
app.put('/api/admin/moderation-logs/:id/review', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const log = await ModerationLog.findByPk(req.params.id);
  if (!log) return res.status(404).json({ error: 'Not found' });
  await log.update({ is_reviewed: true, reviewed_by: req.user.id });
  res.json({ message: 'Reviewed' });
});

// ============ TEMPORARY DATABASE SYNC ============
app.get('/api/sync-db', async (req, res) => {
  try {
    await sequelize.sync({ alter: true });
    res.json({ message: '✅ Database synced successfully!' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});


// ============ SEARCH ROUTES ============

// Search posts by content (case‑insensitive, partial match)
app.get('/api/search/posts', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({ posts: [], count: 0 });
    }
    const searchTerm = `%${q.trim().toLowerCase()}%`;
    const posts = await Post.findAll({
      where: {
        is_deleted: false,
        [Op.or]: [
          sequelize.where(sequelize.fn('LOWER', sequelize.col('content')), 'LIKE', searchTerm),
        ],
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json({ posts, count: posts.length });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search users by username or full name (case‑insensitive, partial match)
app.get('/api/search/users', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({ users: [], count: 0 });
    }
    const searchTerm = `%${q.trim().toLowerCase()}%`;
    const users = await User.findAll({
      where: {
        [Op.or]: [
          sequelize.where(sequelize.fn('LOWER', sequelize.col('username')), 'LIKE', searchTerm),
          sequelize.where(sequelize.fn('LOWER', sequelize.col('full_name')), 'LIKE', searchTerm),
        ],
      },
      attributes: ['id', 'username', 'full_name', 'avatar_url', 'bio'],
      limit: 30,
    });
    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ DIRECT MESSAGES ROUTES ============

// Get all conversations for current user
app.get('/api/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.findAll({
      where: {
        participants: { [Op.contains]: [req.user.id] },
      },
      include: [{ model: Message, as: 'messages', limit: 1, order: [['created_at', 'DESC']] }],
      order: [['last_message_at', 'DESC']],
    });
    // Enrich with other participant's info
    const enriched = await Promise.all(conversations.map(async (conv) => {
      const otherUserId = conv.participants.find(id => id !== req.user.id);
      const otherUser = await User.findByPk(otherUserId, { attributes: ['id', 'username', 'full_name', 'avatar_url'] });
      return {
        id: conv.id,
        otherUser,
        lastMessage: conv.messages?.[0]?.content || '',
        lastMessageAt: conv.last_message_at,
      };
    }));
    res.json(enriched);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a specific conversation
app.get('/api/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const messages = await Message.findAll({
      where: { conversation_id: conversationId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
      order: [['created_at', 'ASC']],
    });
    // Mark messages as read
    await Message.update({ is_read: true, read_at: new Date() }, {
      where: { conversation_id: conversationId, sender_id: { [Op.ne]: req.user.id }, is_read: false },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or get existing conversation with another user
app.post('/api/conversations', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    const otherUser = await User.findByPk(userId);
    if (!otherUser) return res.status(404).json({ error: 'User not found' });
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      where: {
        participants: { [Op.contains]: [req.user.id, userId] },
      },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, userId],
      });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message (also emits via socket)
app.post('/api/messages', auth, async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    if (!conversationId || !content.trim()) return res.status(400).json({ error: 'Invalid data' });
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const message = await Message.create({
      conversation_id: conversationId,
      sender_id: req.user.id,
      content: content.trim(),
    });
    await conversation.update({
      last_message: content.trim(),
      last_message_at: new Date(),
    });
    const populatedMessage = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'full_name', 'avatar_url'] }],
    });
    // Emit to recipient via socket
    const recipientId = conversation.participants.find(id => id !== req.user.id);
    const recipientSocket = userSockets.get(recipientId);
    if (recipientSocket) {
      io.to(recipientSocket).emit('new_message', populatedMessage);
    }
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ERROR HANDLING ============
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
      console.log(`\n🚀 Server on http://0.0.0.0:${PORT}`);
      console.log(`📝 Health: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket enabled\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};
startServer();