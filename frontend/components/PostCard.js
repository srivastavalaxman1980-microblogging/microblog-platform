import { useState } from 'react';
import { FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';

export default function PostCard({ post }) {
  const { user } = useSelector((state) => state.auth);
  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    try {
      const response = await api.post(`/posts/${post.id}/like`);
      setLiked(response.data.liked);
      setLikesCount(prev => response.data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <div className="flex space-x-3">
        <img
          src={post.user?.avatar_url || 'https://via.placeholder.com/50'}
          alt={post.user?.username}
          className="w-12 h-12 rounded-full"
        />
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">{post.user?.full_name || post.user?.username}</span>
            <span className="text-gray-500 text-sm">@{post.user?.username}</span>
            <span className="text-gray-400 text-sm">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          
          <p className="mt-2 text-gray-800">{post.content}</p>
          
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img src={post.media_urls[0]} alt="Post media" className="w-full" />
            </div>
          )}
          
          <div className="flex items-center space-x-6 mt-4 text-gray-500">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 hover:text-red-500 transition ${liked ? 'text-red-500' : ''}`}
            >
              <FiHeart className="text-xl" />
              <span>{likesCount}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 hover:text-primary transition"
            >
              <FiMessageCircle className="text-xl" />
              <span>{post.comments_count || 0}</span>
            </button>
            
            <button className="flex items-center space-x-1 hover:text-primary transition">
              <FiShare2 className="text-xl" />
              <span>{post.shares_count || 0}</span>
            </button>
          </div>
          
          {showComments && (
            <div className="mt-4 border-t pt-4">
              {/* Comments would go here */}
              <p className="text-gray-500 text-sm">Comments coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}