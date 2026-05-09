
## Step 3: Create database schema documentation

Create `database-schema.sql`:

```sql
-- ==========================================
-- MicroBlog Platform Database Schema
-- PostgreSQL 15+
-- ==========================================

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS followers CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    bio TEXT CHECK (LENGTH(bio) <= 160),
    avatar_url VARCHAR(500),
    cover_photo_url VARCHAR(500),
    location VARCHAR(100),
    website VARCHAR(200),
    verified BOOLEAN DEFAULT false,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{"theme":"light","notifications":{"email":true,"push":true,"in_app":true},"privacy":{"profile_visible":"public","allow_messages":"everyone"}}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ==========================================
-- POSTS TABLE
-- ==========================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) BETWEEN 1 AND 280),
    media_urls TEXT[] DEFAULT '{}',
    visibility VARCHAR(20) DEFAULT 'public',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for posts
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_posts_is_deleted ON posts(is_deleted);

-- ==========================================
-- COMMENTS TABLE
-- ==========================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) BETWEEN 1 AND 500),
    likes_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for comments
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- ==========================================
-- FOLLOWERS TABLE
-- ==========================================
CREATE TABLE followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'accepted',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Indexes for followers
CREATE INDEX idx_followers_follower ON followers(follower_id);
CREATE INDEX idx_followers_following ON followers(following_id);
CREATE INDEX idx_followers_status ON followers(status);

-- ==========================================
-- LIKE SYSTEM (Optional - for better performance)
-- ==========================================
-- Uncomment if you want a separate likes table
/*
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_post ON likes(post_id);
*/

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_followers_updated_at BEFORE UPDATE ON followers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- SAMPLE DATA INSERT
-- ==========================================

-- Insert sample users (passwords: John123!, Jane123!, Admin123!)
INSERT INTO users (id, username, email, password_hash, full_name, bio, role) VALUES
    (gen_random_uuid(), 'john_doe', 'john@example.com', '$2a$10$YourHashedPasswordHere', 'John Doe', 'Software developer and tech enthusiast', 'user'),
    (gen_random_uuid(), 'jane_smith', 'jane@example.com', '$2a$10$YourHashedPasswordHere', 'Jane Smith', 'Digital marketer', 'user'),
    (gen_random_uuid(), 'admin', 'admin@microblog.com', '$2a$10$YourHashedPasswordHere', 'Admin User', 'Platform administrator', 'admin');

-- ==========================================
-- DATABASE STATISTICS VIEWS
-- ==========================================

-- User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT c.id) AS total_comments,
    (SELECT COUNT(*) FROM followers WHERE following_id = u.id) AS follower_count,
    (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) AS following_count,
    u.created_at AS joined_date
FROM users u
LEFT JOIN posts p ON p.user_id = u.id AND p.is_deleted = false
LEFT JOIN comments c ON c.user_id = u.id AND c.is_deleted = false
GROUP BY u.id;

-- Engagement statistics
CREATE OR REPLACE VIEW post_engagement_stats AS
SELECT 
    p.id,
    p.content,
    p.likes_count,
    p.comments_count,
    p.shares_count,
    (p.likes_count + p.comments_count + p.shares_count) AS total_engagement,
    u.username AS author,
    p.created_at
FROM posts p
JOIN users u ON u.id = p.user_id
WHERE p.is_deleted = false
ORDER BY total_engagement DESC;

-- ==========================================
-- QUERY EXAMPLES
-- ==========================================

-- Get feed for a user (posts from followed users)
/*
SELECT p.*, u.username, u.full_name, u.avatar_url
FROM posts p
JOIN users u ON u.id = p.user_id
LEFT JOIN followers f ON f.following_id = p.user_id
WHERE f.follower_id = 'user_id_here' OR p.user_id = 'user_id_here'
AND p.is_deleted = false
ORDER BY p.created_at DESC
LIMIT 50;
*/

-- Get trending hashtags (if implemented)
/*
SELECT 
    SUBSTRING(content FROM '#[A-Za-z0-9]+') AS hashtag,
    COUNT(*) AS usage_count
FROM posts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY hashtag
ORDER BY usage_count DESC
LIMIT 10;
*/