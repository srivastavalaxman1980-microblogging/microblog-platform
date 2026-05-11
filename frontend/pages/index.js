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
    // Server responded with an error status (4xx, 5xx)
    const serverMessage = error.response.data?.error || 'Failed to create post';
    toast.error(serverMessage);
  } else if (error.request) {
    toast.error('No response from server. Check your connection.');
  } else {
    toast.error('Failed to create post');
  }
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
    // Add the new share to the top of the feed (optimistic update)
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

// LoginPage (unchanged, kept for completeness)
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