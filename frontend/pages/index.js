import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Navbar from '../components/Navbar';

// ============ API URL CONFIGURATION ============
// Use environment variable or fallback to production backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

console.log('🔗 Frontend API_URL:', API_URL);
// =============================================

export default function Home({ isAuthenticated, user, setIsAuthenticated, setUser }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
    }
  }, [isAuthenticated]);

  const fetchFeed = async () => {
    setFeedLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping feed fetch');
        return;
      }
      
      console.log('Fetching feed from:', `${API_URL}/posts/feed`);
      
      const response = await axios.get(`${API_URL}/posts/feed`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Feed response:', response.data);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching feed:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        toast.error(error.response.data?.error || 'Failed to load feed');
      } else if (error.request) {
        console.error('No response from server');
        toast.error('Cannot connect to server. Make sure backend is running.');
      } else {
        toast.error('Error loading feed');
      }
    } finally {
      setFeedLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    if (content.length > 280) {
      toast.error('Post cannot exceed 280 characters');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }
      
      console.log('Creating post at:', `${API_URL}/posts`);
      
      const response = await axios.post(`${API_URL}/posts`, 
        { content: content.trim(), visibility: 'public' },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log('Post created:', response.data);
      toast.success('Post created successfully!');
      setContent('');
      fetchFeed();
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        toast.error(error.response.data?.error || 'Failed to create post');
      } else if (error.request) {
        toast.error('No response from server. Make sure backend is running.');
      } else {
        toast.error('Error creating post');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/posts/${postId}/like`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes_count: response.data.likes_count }
          : post
      ));
      
      toast.success('Liked!');
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Post deleted successfully');
      fetchFeed();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleEditPost = (updatedPost) => {
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    toast.success('Logged out successfully');
  };

  if (!isAuthenticated) {
    return <LoginPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} API_URL={API_URL} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUser={user} />
      
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Post composer */}
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
            <div className="flex justify-between items-center mt-3">
              <span className={`text-sm ${content.length > 260 ? 'text-orange-500' : 'text-gray-500'}`}>
                {content.length}/280
              </span>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-6 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50 transition"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        {/* Feed */}
        {feedLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading posts...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No posts yet. Be the first to post!</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLike={handleLike}
                  onDelete={handleDeletePost}
                  onEdit={handleEditPost}
                  currentUser={user}
                  API_URL={API_URL}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ LOGIN PAGE COMPONENT ============
function LoginPage({ setIsAuthenticated, setUser, API_URL }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  console.log('🔐 LoginPage using API_URL:', API_URL);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('📡 Attempting login with API_URL:', API_URL);
    console.log('📧 Email:', email);

    try {
      let response;
      if (isLogin) {
        const loginUrl = `${API_URL}/auth/login`;
        console.log('📡 POST to:', loginUrl);
        
        response = await axios.post(loginUrl, { email, password });
        console.log('✅ Login response:', response.data);
        toast.success('Login successful!');
      } else {
        if (!username || !email || !password) {
          toast.error('Please fill in all fields');
          setLoading(false);
          return;
        }
        response = await axios.post(`${API_URL}/auth/register`, {
          username,
          email,
          password,
          full_name: fullName || username
        });
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
      setIsAuthenticated(true);
      setUser(user);
      toast.success(`Welcome, ${user.full_name || user.username}!`);
    } catch (error) {
      console.error('❌ Auth error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        toast.error(error.response.data?.error || 'Authentication failed');
      } else if (error.request) {
        console.error('No response received from server');
        toast.error('Cannot connect to server. Please check if backend is running.');
      } else {
        console.error('Error message:', error.message);
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-bold text-primary text-center mb-2">MicroBlog</h1>
        <p className="text-gray-500 text-center mb-8">Connect, share, and discover</p>
        
        <h2 className="text-xl font-semibold text-center mb-6">
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Username *"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-primary"
                required
              />
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-primary"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-primary"
            required
          />
          <input
            type="password"
            placeholder="Password *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-primary"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-full hover:bg-blue-600 transition disabled:opacity-50 font-semibold"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setEmail('');
              setPassword('');
              setUsername('');
              setFullName('');
            }}
            className="text-primary hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ============ EDIT POST MODAL COMPONENT ============
function EditPostModal({ post, isOpen, onClose, onUpdate, API_URL }) {
  const [content, setContent] = useState(post?.content || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }
    
    if (content.length > 280) {
      toast.error('Post cannot exceed 280 characters');
      return;
    }
    
    if (content.trim() === post.content) {
      toast.error('No changes made');
      onClose();
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/posts/${post.id}`,
        { content: content.trim() },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast.success('Post updated successfully!');
      onUpdate(response.data.post);
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(error.response?.data?.error || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-primary resize-none"
              rows="4"
              maxLength="280"
              autoFocus
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-sm ${content.length > 260 ? 'text-orange-500' : 'text-gray-500'}`}>
                {content.length}/280
              </span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:text-gray-900">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="bg-primary text-white px-6 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ COMMENT SECTION COMPONENT ============
function CommentSection({ postId, isAuthenticated, currentUser, API_URL }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyToId, setReplyToId] = useState(null);

  useEffect(() => {
    if (postId) fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/posts/${postId}/comments`, 
        { content: newComment.trim(), parent_comment_id: replyToId || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Comment added!');
      setNewComment('');
      setReplyingTo(null);
      setReplyToId(null);
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Comment deleted');
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const formatCommentDate = (date) => {
    if (!date) return 'Just now';
    try {
      const commentDate = new Date(date);
      if (isNaN(commentDate.getTime())) return 'Just now';
      
      const now = new Date();
      const diffSeconds = Math.floor((now - commentDate) / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays >= 1) {
        return commentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      if (diffHours >= 1) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      if (diffMinutes >= 1) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
      return 'Just now';
    } catch (e) {
      return 'Just now';
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="font-semibold text-gray-900 mb-3">Comments ({comments.length})</h4>
      
      {isAuthenticated && (
        <form onSubmit={handleSubmitComment} className="mb-4">
          {replyingTo && (
            <div className="mb-2 text-sm text-primary">
              Replying to @{replyingTo}
              <button type="button" onClick={() => { setReplyingTo(null); setReplyToId(null); }} className="ml-2 text-gray-500">Cancel</button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? `Reply to @${replyingTo}...` : "Write a comment..."}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-primary resize-none"
            rows="2"
            maxLength="500"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">{newComment.length}/500</span>
            <button type="submit" disabled={loading} className="bg-primary text-white px-4 py-1 rounded-full text-sm">
              {loading ? 'Posting...' : (replyingTo ? 'Reply' : 'Comment')}
            </button>
          </div>
        </form>
      )}
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm">{comment.user?.full_name || comment.user?.username}</span>
                      <Link href={`/profile/${comment.user?.id}`} className="text-xs text-gray-500 hover:text-primary hover:underline">
                        @{comment.user?.username}
                      </Link>
                      <span className="text-xs text-gray-400">{formatCommentDate(comment.created_at)}</span>
                    </div>
                    <p className="text-gray-800 text-sm mt-1">{comment.content}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <button className="text-xs text-gray-500 hover:text-primary">❤️ {comment.likes_count || 0}</button>
                      {isAuthenticated && (
                        <button onClick={() => { setReplyingTo(comment.user?.username); setReplyToId(comment.id); }} className="text-xs text-gray-500 hover:text-primary">Reply</button>
                      )}
                      {(currentUser?.id === comment.user_id || currentUser?.role === 'admin') && (
                        <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-red-500">Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 mt-3 space-y-3 border-l-2 border-gray-200 pl-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-white rounded-lg p-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {reply.user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs">{reply.user?.full_name || reply.user?.username}</span>
                            <Link href={`/profile/${reply.user?.id}`} className="text-xs text-gray-500 hover:text-primary hover:underline">
                              @{reply.user?.username}
                            </Link>
                            <span className="text-xs text-gray-400">{formatCommentDate(reply.created_at)}</span>
                          </div>
                          <p className="text-gray-800 text-sm mt-1">{reply.content}</p>
                        </div>
                      </div>
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

// ============ POST CARD COMPONENT ============
function PostCard({ post, onLike, onDelete, onEdit, currentUser, API_URL }) {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatPostDate = (date) => {
    if (!date) return 'Just now';
    try {
      const postDate = new Date(date);
      if (isNaN(postDate.getTime())) return 'Just now';
      
      const now = new Date();
      const diffSeconds = Math.floor((now - postDate) / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays >= 1) {
        return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      if (diffHours >= 1) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      if (diffMinutes >= 1) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
      if (diffSeconds >= 5) return `${diffSeconds} seconds ago`;
      return 'Just now';
    } catch (error) {
      return 'Just now';
    }
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
      <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition relative">
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <Link href={`/profile/${post.user?.id}`}>
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:opacity-80 transition">
                {post.user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </Link>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-wrap gap-x-2">
                <Link href={`/profile/${post.user?.id}`} className="font-semibold text-gray-900 hover:text-primary hover:underline">
                  {post.user?.full_name || post.user?.username}
                </Link>
                <Link href={`/profile/${post.user?.id}`} className="text-sm text-gray-500 hover:text-primary hover:underline">
                  @{post.user?.username}
                </Link>
                <span className="text-xs text-gray-400 cursor-help" title={new Date(post.created_at).toLocaleString()}>
                  {formatPostDate(post.created_at)}
                </span>
                {post.updated_at !== post.created_at && (
                  <span className="text-xs text-gray-400" title="Edited">(edited)</span>
                )}
              </div>
              
              {canModify && (
                <div className="relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                      <button onClick={handleEdit} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        📝 Edit Post
                      </button>
                      <button onClick={handleDelete} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                        🗑️ Delete Post
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <p className="mt-2 text-gray-800 whitespace-pre-wrap">{post.content}</p>
            
            <div className="flex items-center space-x-6 mt-3">
              <button onClick={handleLocalLike} disabled={isLiking} className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition">
                <span className="text-xl">❤️</span>
                <span>{likesCount}</span>
              </button>
              <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-1 text-gray-500 hover:text-primary transition">
                <span className="text-xl">💬</span>
                <span>{post.comments_count || 0}</span>
              </button>
            </div>
            
            {showComments && (
              <CommentSection 
                postId={post.id}
                isAuthenticated={!!currentUser}
                currentUser={currentUser}
                API_URL={API_URL}
              />
            )}
          </div>
        </div>
      </div>
      
      <EditPostModal 
        post={post} 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        onUpdate={onEdit}
        API_URL={API_URL}
      />
    </>
  );
}