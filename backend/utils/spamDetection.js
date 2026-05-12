// In‑memory stores (automatically cleaned up every hour)
const userPostCounts = new Map();       // userId -> { count, resetTime }
const userRecentPosts = new Map();      // userId -> [{ content, timestamp }]

// Configurable limits
const RATE_LIMIT_WINDOW_MS = 60 * 1000;      // 1 minute
const RATE_LIMIT_MAX = 5;                   // max 5 posts per minute
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;   // 5 minutes

// Basic spam keyword list (extendable)
const SPAM_KEYWORDS = [
  'buy now', 'click here', 'free money', 'earn cash', 'viagra', 'casino',
  'lottery', 'winner', 'prize', 'investment', 'bitcoin', 'crypto',
  'make money fast', 'work from home', '$$$', '!!!', 'spam'
];

// ------------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------------
const containsSpamKeywords = (text) => {
  const lower = text.toLowerCase();
  return SPAM_KEYWORDS.some(kw => lower.includes(kw));
};

const hasExcessiveCaps = (text) => {
  const caps = (text.match(/[A-Z]/g) || []).length;
  const letters = text.replace(/[^a-zA-Z]/g, '').length;
  return letters > 0 && (caps / letters) > 0.6;   // >60% uppercase
};

const hasTooManyLinks = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const matches = text.match(urlRegex) || [];
  return matches.length > 2;
};

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------
const checkSpam = (content) => {
  if (containsSpamKeywords(content))
    return { isSpam: true, reason: 'Spam keywords detected' };
  if (hasExcessiveCaps(content))
    return { isSpam: true, reason: 'Excessive capital letters' };
  if (hasTooManyLinks(content))
    return { isSpam: true, reason: 'Too many links' };
  return { isSpam: false };
};

const isRateLimited = (userId) => {
  if (!userPostCounts.has(userId)) return false;
  const record = userPostCounts.get(userId);
  if (Date.now() > record.resetTime) return false;
  return record.count >= RATE_LIMIT_MAX;
};

const isDuplicatePost = (userId, content) => {
  if (!userRecentPosts.has(userId)) return false;
  const now = Date.now();
  const userPosts = userRecentPosts.get(userId);
  return userPosts.some(p =>
    p.timestamp > now - DUPLICATE_WINDOW_MS && p.content === content
  );
};

const recordPost = (userId, content) => {
  // Rate limit counting
  const now = Date.now();
  if (!userPostCounts.has(userId)) {
    userPostCounts.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  } else {
    const record = userPostCounts.get(userId);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + RATE_LIMIT_WINDOW_MS;
    } else {
      record.count++;
    }
  }

  // Duplicate tracking
  if (!userRecentPosts.has(userId)) {
    userRecentPosts.set(userId, []);
  }
  const posts = userRecentPosts.get(userId);
  posts.push({ content, timestamp: now });
  // Keep only last 5 minutes
  const cutoff = now - DUPLICATE_WINDOW_MS;
  userRecentPosts.set(userId, posts.filter(p => p.timestamp > cutoff));
};

const cleanup = () => {
  const now = Date.now();
  // Clean rate limit map
  for (const [userId, record] of userPostCounts.entries()) {
    if (now > record.resetTime) userPostCounts.delete(userId);
  }
  // Clean duplicate map
  for (const [userId, posts] of userRecentPosts.entries()) {
    const cutoff = now - DUPLICATE_WINDOW_MS;
    const filtered = posts.filter(p => p.timestamp > cutoff);
    if (filtered.length === 0) userRecentPosts.delete(userId);
    else userRecentPosts.set(userId, filtered);
  }
};

module.exports = {
  checkSpam,
  isRateLimited,
  isDuplicatePost,
  recordPost,
  cleanup,
};