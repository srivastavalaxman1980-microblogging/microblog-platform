import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import ImageUploader from '../components/ImageUploader';
import TrendingHashtags from '../components/TrendingHashtags';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

// Axios interceptor to attach token
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
      toast.error('Failed to create post');
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
          {/* Main feed column */}
          <div className="flex-1 max-w-2xl">
            {/* Post composer */}
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
                    className="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-600 disabled:opacity-50 transition"
                  >
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </div>

            {/* Feed */}
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
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right sidebar – Trending Hashtags (only visible on large screens) */}
          <div className="hidden lg:block w-80">
            <TrendingHashtags />
          </div>
        </div>
      </div>
    </div>
  );
}

// LoginPage (same as before, dark theme)
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

// ============ POST CARD COMPONENT (with clickable hashtags) ============
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
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString();
  };

  const renderContentWithHashtags = (text) => {
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, idx) => {
      if (part.match(/^#\w+$/)) {
        const tag = part.substring(1);
        return (
          <Link key={idx} href={`/hashtag/${tag}`}>
            <span className="text-red-400 hover:text-red-300 cursor-pointer">{part}</span>
          </Link>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const handleLocalLike = async () => {
    setIsLiking(true);
    await onLike(post.id);
    setLikesCount(prev => prev + 1);
    setIsLiking(false);
  };

  const handleDelete = async () => {
    setShowMenu(false);
    await onDelete(post.id);
  };

  const handleEdit = () => {
    setShowEditModal(true);
    setShowMenu(false);
  };

  const isOwner = currentUser?.id === post.user_id;
  const isAdmin = currentUser?.role === 'admin';
  const canModify = isOwner || isAdmin;

  return (
    <>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 relative">
        <div className="flex space-x-3">
          <Link href={`/profile/${post.user?.id}`}>
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer">
              {post.user?.username?.charAt(0).toUpperCase()}
            </div>
          </Link>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-x-2 flex-wrap">
                <Link href={`/profile/${post.user?.id}`} className="font-semibold text-white hover:text-red-500">
                  {post.user?.full_name || post.user?.username}
                </Link>
                <Link href={`/profile/${post.user?.id}`} className="text-sm text-gray-500">
                  @{post.user?.username}
                </Link>
                <span className="text-xs text-gray-600">{formatDate(post.created_at)}</span>
              </div>
              {canModify && (
                <div className="relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="text-gray-500 hover:text-white">⋮</button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 shadow-lg rounded-md z-10">
                      <button onClick={handleEdit} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700">Edit</button>
                      <button onClick={handleDelete} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700">Delete</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-gray-200 whitespace-pre-wrap">
              {renderContentWithHashtags(post.content)}
            </p>
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {post.media_urls.map((url, idx) => (
                  <img key={idx} src={url} alt="media" className="rounded-lg w-full h-48 object-cover" />
                ))}
              </div>
            )}
            <div className="flex items-center space-x-6 mt-3">
              <button onClick={handleLocalLike} disabled={isLiking} className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition">
                <span className="text-xl">❤️</span>
                <span>{likesCount}</span>
              </button>
              <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-1 text-gray-500 hover:text-secondary transition">
                <span className="text-xl">💬</span>
                <span>{post.comments_count || 0}</span>
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

// ============ COMMENT SECTION (dark) ============
function CommentSection({ postId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchComments(); }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts/${postId}/comments`);
      setComments(res.data.comments || []);
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/posts/${postId}/comments`, { content: newComment.trim() });
      toast.success('Comment added');
      setNewComment('');
      fetchComments();
    } catch (error) { toast.error('Failed to comment'); }
    finally { setLoading(false); }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-800">
      <h4 className="font-semibold text-white mb-2">Comments ({comments.length})</h4>
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." rows="2" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500" maxLength="500" />
        <button type="submit" disabled={loading} className="mt-2 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold hover:bg-red-600">Post</button>
      </form>
      <div className="space-y-2">
        {comments.map(c => (
          <div key={c.id} className="bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{c.user?.full_name || c.user?.username}</span>
              <span className="text-xs text-gray-500">@{c.user?.username}</span>
            </div>
            <p className="text-sm text-gray-300 mt-1">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ EDIT POST MODAL (dark) ============
function EditPostModal({ post, isOpen, onClose, onUpdate }) {
  const [content, setContent] = useState(post?.content || '');
  const [images, setImages] = useState(post?.media_urls?.map(url => ({ url, public_id: url.split('/').pop() })) || []);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (post) {
      setContent(post.content || '');
      setImages(post.media_urls?.map(url => ({ url, public_id: url.split('/').pop() })) || []);
    }
  }, [post]);

  if (!isOpen) return null;

  const handleRemoveImage = async (index, publicId) => {
    try {
      await axios.delete(`${API_URL}/upload/${publicId}`);
    } catch (err) { console.error(err); }
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 4) { toast.error('Max 4 images'); return; }
    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    try {
      const res = await axios.post(`${API_URL}/upload/multiple`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImages(prev => [...prev, ...res.data.images]);
      toast.success('Images added');
    } catch (err) { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) { toast.error('Content or images required'); return; }
    setLoading(true);
    try {
      const media_urls = images.map(img => img.url);
      const res = await axios.put(`${API_URL}/posts/${post.id}`, { content: content.trim(), media_urls });
      toast.success('Post updated');
      onUpdate(res.data.post);
      onClose();
    } catch (error) { toast.error('Update failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-md p-4 border border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Edit Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 resize-none" rows="4" maxLength="280" placeholder="What's on your mind?" />
          <div className="text-xs text-gray-500 text-right mt-1">{content.length}/280</div>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative">
                  <img src={img.url} className="w-20 h-20 object-cover rounded" alt="preview" />
                  <button type="button" onClick={() => handleRemoveImage(idx, img.public_id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3">
            <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-full text-sm inline-block transition">
              📷 Add Images
              <input type="file" multiple accept="image/*" onChange={handleAddImages} disabled={uploading || images.length >= 4} className="hidden" />
            </label>
            {uploading && <span className="ml-2 text-sm text-gray-500">Uploading...</span>}
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={loading} className="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-600 disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}