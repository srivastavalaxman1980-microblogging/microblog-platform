import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';

const API_URL = 'http://localhost:5000/api';

export default function CommentSection({ postId, isAuthenticated, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
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
      const payload = { 
        content: newComment.trim(),
        parent_comment_id: replyingTo || null
      };
      
      const response = await axios.post(`${API_URL}/posts/${postId}/comments`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Comment added!');
      setNewComment('');
      setReplyingTo(null);
      setReplyTo(null);
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(error.response?.data?.error || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
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

  const formatDate = (date) => {
    const commentDate = new Date(date);
    const now = new Date();
    const diffHours = (now - commentDate) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return formatDistanceToNow(commentDate, { addSuffix: true });
    } else {
      return format(commentDate, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="font-semibold text-gray-900 mb-3">
        Comments ({comments.length})
      </h4>
      
      {/* Comment input */}
      {isAuthenticated && (
        <form onSubmit={handleSubmitComment} className="mb-4">
          {replyingTo && (
            <div className="mb-2 text-sm text-primary">
              Replying to @{replyingTo}
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyTo(null);
                }}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
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
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-4 py-1 rounded-full hover:bg-blue-600 disabled:opacity-50 text-sm"
            >
              {loading ? 'Posting...' : (replyingTo ? 'Reply' : 'Comment')}
            </button>
          </div>
        </form>
      )}
      
      {/* Comments list */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm">
                        {comment.user?.full_name || comment.user?.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        @{comment.user?.username}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm mt-1">{comment.content}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <button className="text-xs text-gray-500 hover:text-primary transition">
                        ❤️ {comment.likes_count || 0}
                      </button>
                      {isAuthenticated && (
                        <button
                          onClick={() => {
                            setReplyingTo(comment.user?.username);
                            setReplyTo(comment.id);
                            setNewComment('');
                            document.querySelector('textarea')?.focus();
                          }}
                          className="text-xs text-gray-500 hover:text-primary transition"
                        >
                          Reply
                        </button>
                      )}
                      {(currentUser?.id === comment.user_id || currentUser?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-500 hover:text-red-700 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 mt-3 space-y-3 border-l-2 border-gray-200 pl-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-white rounded-lg p-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {reply.user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs">
                              {reply.user?.full_name || reply.user?.username}
                            </span>
                            <span className="text-xs text-gray-500">
                              @{reply.user?.username}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(reply.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-800 text-sm mt-1">{reply.content}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <button className="text-xs text-gray-500 hover:text-primary transition">
                              ❤️ {reply.likes_count || 0}
                            </button>
                          </div>
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