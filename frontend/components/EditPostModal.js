import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

export default function EditPostModal({ post, isOpen, onClose, onUpdate }) {
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