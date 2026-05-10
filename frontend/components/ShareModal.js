import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

export default function ShareModal({ post, isOpen, onClose, onShareSuccess }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (comment.length > 280) {
      toast.error('Comment too long (max 280 characters)');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/posts/${post.id}/share`, { comment: comment.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Post shared!');
      onShareSuccess(res.data);
      onClose();
      setComment('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-md p-4 border border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Share this post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl">✕</button>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 mb-3">
          <p className="text-gray-300 text-sm">{post.content.substring(0, 100)}...</p>
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment (optional)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 resize-none"
          rows="3"
          maxLength="280"
        />
        <div className="text-xs text-gray-500 text-right mt-1">{comment.length}/280</div>
        <div className="flex justify-end space-x-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
          <button onClick={handleShare} disabled={loading} className="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-600 disabled:opacity-50">
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}