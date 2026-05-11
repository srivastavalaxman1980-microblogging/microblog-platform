import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import ImageUploader from '../components/ImageUploader';
import TrendingHashtags from '../components/TrendingHashtags';
import PostCard from '../components/PostCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function Home({ isAuthenticated, user, setIsAuthenticated, setUser }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) fetchFeed();
  }, [isAuthenticated]);

  const fetchFeed = async () => {
    setFeedLoading(true);
    try {
      const res = await axios.get(`${API_URL}/posts/feed`);
      setPosts(res.data.posts || []);
    } catch (error) {
      toast.error('Failed to load feed');
    } finally {
      setFeedLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) {
      toast.error('Add content or images');
      return;
    }
    setLoading(true);
    try {
      const media_urls = images.map(img => img.url);
      await axios.post(`${API_URL}/posts`, { content: content.trim(), visibility: 'public', media_urls });
      toast.success('Post created!');
      setContent('');
      setImages([]);
      fetchFeed();
    } catch (error) {
      console.error('Create post error:', error);
      if (error.response) {
        const serverMessage = error.response.data?.error || 'Failed to create post';
        toast.error(serverMessage);
      } else if (error.request) {
        toast.error('No response from server. Check your connection.');
      } else {
        toast.error('Failed to create post');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`${API_URL}/posts/${postId}/like`);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: res.data.likes_count } : p));
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      await axios.delete(`${API_URL}/posts/${postId}`);
      toast.success('Post deleted');
      fetchFeed();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEditPost = (updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handleShareSuccess = (newShare) => {
    setPosts(prev => [newShare, ...prev]);
    toast.success('Post shared!');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    toast.success('Logged out');
  };

  if (!isAuthenticated) {
    return <LoginPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} />;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar currentUser={user} />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main feed */}
          <div className="flex-1 max-w-2xl">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
              <form onSubmit={handleCreatePost}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 resize-none"
                  rows="3"
                  maxLength="280"
                />
                <ImageUploader onImagesUploaded={setImages} maxImages={4} />
                <div className="flex justify-between items-center mt-3">
                  <span className={`text-sm ${content.length > 260 ? 'text-red-400' : 'text-gray-500'}`}>
                    {content.length}/280
                  </span>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-600 disabled:opacity-50"
                  >
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </div>

            {feedLoading ? (
              <div className="text-center py-12 text-gray-500">Loading posts...</div>
            ) : (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                    <p className="text-gray-500">No posts yet. Be the first!</p>
                  </div>
                ) : (
                  posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onDelete={handleDeletePost}
                      onEdit={handleEditPost}
                      currentUser={user}
                      onShareSuccess={handleShareSuccess}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:block w-80">
            <TrendingHashtags />
          </div>
        </div>
      </div>
    </div>
  );
}

// LoginPage Component (unchanged)
function LoginPage({ setIsAuthenticated, setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (isLogin) {
        response = await axios.post(`${API_URL}/auth/login`, { email, password });
        toast.success('Login successful!');
      } else {
        response = await axios.post(`${API_URL}/auth/register`, { username, email, password, full_name: fullName || username });
        toast.success('Registration successful! Please login.');
        setIsLogin(true);
        setLoading(false);
        setUsername('');
        setEmail('');
        setPassword('');
        setFullName('');
        return;
      }
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-xl border border-gray-800 shadow-xl p-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent text-center mb-2">Aureon</h1>
        <p className="text-gray-500 text-center mb-8">Connect, share, discover</p>
        <h2 className="text-xl font-semibold text-white text-center mb-6">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input type="text" placeholder="Username *" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500" required />
              <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500" />
            </>
          )}
          <input type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500" required />
          <input type="password" placeholder="Password *" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500" required />
          <button type="submit" disabled={loading} className="w-full bg-red-500 text-white py-3 rounded-full font-semibold hover:bg-red-600 transition disabled:opacity-50">
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
        <p className="text-center mt-6 text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setEmail(''); setPassword(''); setUsername(''); setFullName(''); }} className="text-red-500 hover:underline">
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ============ FIXED COMMENT SECTION ============
function CommentSection({ postId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyToId, setReplyToId] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts/${postId}/comments`);
      setComments(res.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const payload = {
        content: newComment.trim(),
        parent_comment_id: replyToId || null,
      };
      await axios.post(`${API_URL}/posts/${postId}/comments`, payload);
      toast.success('Comment added');
      setNewComment('');
      setReplyingTo(null);
      setReplyToId(null);
      await fetchComments(); // refresh comments
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to comment';
      toast.error(msg);
    } finally {
      setLoading(false); // always reset loading
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Just now';
    const d = new Date(date);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString();
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-800">
      <h4 className="font-semibold text-white mb-2">Comments ({comments.length})</h4>
      <form onSubmit={handleSubmit} className="mb-4">
        {replyingTo && (
          <div className="mb-2 text-sm text-red-400">
            Replying to @{replyingTo}
            <button
              type="button"
              onClick={() => {
                setReplyingTo(null);
                setReplyToId(null);
                setNewComment('');
              }}
              className="ml-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyingTo ? `Reply to @${replyingTo}...` : 'Write a comment...'}
          rows="2"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
          maxLength="500"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">{newComment.length}/500</span>
          <button
            type="submit"
            disabled={loading}
            className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Posting...' : replyingTo ? 'Reply' : 'Post'}
          </button>
        </div>
      </form>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">
                  {comment.user?.full_name || comment.user?.username}
                </span>
                <span className="text-xs text-gray-500">@{comment.user?.username}</span>
                <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-sm text-gray-300 mt-1">{comment.content}</p>
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => {
                    setReplyingTo(comment.user?.username);
                    setReplyToId(comment.id);
                    setNewComment('');
                  }}
                  className="text-xs text-gray-400 hover:text-red-400"
                >
                  Reply
                </button>
              </div>

              {/* Nested replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-6 mt-3 space-y-2 border-l border-gray-700 pl-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-750 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">
                          {reply.user?.full_name || reply.user?.username}
                        </span>
                        <span className="text-xs text-gray-500">@{reply.user?.username}</span>
                        <span className="text-xs text-gray-500">{formatDate(reply.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}