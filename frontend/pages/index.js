import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import ImageUploader from '../components/ImageUploader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

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
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/posts/feed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      toast.error('Please add content or images');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const media_urls = images.map(img => img.url);
      await axios.post(`${API_URL}/posts`, 
        { content: content.trim(), visibility: 'public', media_urls },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Post created!');
      setContent('');
      setImages([]);
      fetchFeed();
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: res.data.likes_count } : p));
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Post deleted');
      fetchFeed();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEditPost = (updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
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
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUser={user} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form onSubmit={handleCreatePost}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-primary resize-none"
              rows="3"
              maxLength="280"
            />
            <ImageUploader onImagesUploaded={setImages} maxImages={4} />
            <div className="flex justify-between items-center mt-3">
              <span className={`text-sm ${content.length > 260 ? 'text-orange-500' : 'text-gray-500'}`}>
                {content.length}/280
              </span>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-6 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        {feedLoading ? (
          <div className="text-center py-12">Loading posts...</div>
        ) : (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p>No posts yet. Be the first!</p>
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
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// LoginPage component (same as before, omitted for brevity – keep your existing one)
function LoginPage({ setIsAuthenticated, setUser }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-bold text-primary text-center mb-2">MicroBlog</h1>
        <p className="text-gray-500 text-center mb-8">Connect, share, and discover</p>
        <h2 className="text-xl font-semibold text-center mb-6">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input type="text" placeholder="Username *" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3" required />
              <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3" />
            </>
          )}
          <input type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3" required />
          <input type="password" placeholder="Password *" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3" required />
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-full hover:bg-blue-600 font-semibold">
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
        <p className="text-center mt-6 text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setEmail(''); setPassword(''); setUsername(''); setFullName(''); }} className="text-primary hover:underline">
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

// PostCard component (updated to show images)
function PostCard({ post, onLike, onDelete, onEdit, currentUser }) {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatDate = (date) => {
    if (!date) return 'Just now';
    const d = new Date(date);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return `${Math.floor(diff)} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4 relative">
        <div className="flex space-x-3">
          <Link href={`/profile/${post.user?.id}`}>
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer">
              {post.user?.username?.charAt(0).toUpperCase()}
            </div>
          </Link>
          <div className="flex-1">
            <div className="flex justify-between">
              <div className="flex items-center gap-x-2">
                <Link href={`/profile/${post.user?.id}`} className="font-semibold hover:text-primary">
                  {post.user?.full_name || post.user?.username}
                </Link>
                <Link href={`/profile/${post.user?.id}`} className="text-sm text-gray-500">
                  @{post.user?.username}
                </Link>
                <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
              </div>
              {(currentUser?.id === post.user_id || currentUser?.role === 'admin') && (
                <div className="relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="text-gray-500">⋮</button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-32 bg-white shadow-lg rounded-md z-10 border">
                      <button onClick={() => { setShowEditModal(true); setShowMenu(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Edit</button>
                      <button onClick={() => { onDelete(post.id); setShowMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-gray-800">{post.content}</p>
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {post.media_urls.map((url, idx) => (
                  <img key={idx} src={url} alt="post media" className="rounded-lg w-full h-48 object-cover" />
                ))}
              </div>
            )}
            <div className="flex items-center space-x-6 mt-3">
              <button onClick={() => { setIsLiking(true); onLike(post.id); setLikesCount(l => l + 1); setIsLiking(false); }} disabled={isLiking} className="flex items-center space-x-1 text-gray-500 hover:text-red-500">
                <span className="text-xl">❤️</span> <span>{likesCount}</span>
              </button>
              <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-1 text-gray-500 hover:text-primary">
                <span className="text-xl">💬</span> <span>{post.comments_count || 0}</span>
              </button>
            </div>
            {showComments && <CommentSection postId={post.id} currentUser={currentUser} />}
          </div>
        </div>
      </div>
      <EditPostModal post={post} isOpen={showEditModal} onClose={() => setShowEditModal(false)} onUpdate={onEdit} />
    </>
  );
}

// CommentSection (simplified – same as before, but ensure it works)
function CommentSection({ postId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { fetchComments(); }, [postId]);
  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/posts/${postId}/comments`, { headers: { Authorization: `Bearer ${token}` } });
      setComments(res.data.comments || []);
    } catch (error) { console.error(error); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/posts/${postId}/comments`, { content: newComment.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Comment added');
      setNewComment('');
      fetchComments();
    } catch (error) { toast.error('Failed to comment'); }
    finally { setLoading(false); }
  };
  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="font-semibold mb-2">Comments ({comments.length})</h4>
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." rows="2" className="w-full border rounded-lg p-2" maxLength="500" />
        <button type="submit" disabled={loading} className="mt-2 bg-primary text-white px-4 py-1 rounded-full text-sm">Post</button>
      </form>
      <div className="space-y-2">
        {comments.map(c => (
          <div key={c.id} className="bg-gray-50 p-2 rounded">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{c.user?.full_name || c.user?.username}</span>
              <span className="text-xs text-gray-500">@{c.user?.username}</span>
            </div>
            <p className="text-sm mt-1">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditPostModal({ post, isOpen, onClose, onUpdate }) {
  const [content, setContent] = useState(post?.content || '');
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/posts/${post.id}`, { content: content.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Post updated');
      onUpdate(res.data.post);
      onClose();
    } catch (error) { toast.error('Update failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-4">
        <div className="flex justify-between mb-4"><h2 className="text-xl">Edit Post</h2><button onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit}>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows="4" className="w-full border rounded-lg p-2" maxLength="280" autoFocus />
          <div className="flex justify-end mt-4"><button type="submit" disabled={loading} className="bg-primary text-white px-4 py-2 rounded-full">Save</button></div>
        </form>
      </div>
    </div>
  );
}