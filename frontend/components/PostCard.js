import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import ShareModal from './ShareModal';
import CommentSection from './CommentSection'; // you already have this
import EditPostModal from './EditPostModal';   // you already have this

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

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

export default function PostCard({ post, onLike, onDelete, onEdit, currentUser, onShareSuccess }) {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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

  // Determine if this post is a share (retweet)
  const isShared = !!post.shared_from;
  const originalPost = post.original;

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
                {isShared && <span className="text-xs text-gray-500">🔁 shared</span>}
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

            {/* Share comment (if any) */}
            {post.content && !isShared && (
              <p className="mt-2 text-gray-200 whitespace-pre-wrap">
                {renderContentWithHashtags(post.content)}
              </p>
            )}
            {isShared && post.share_comment && (
              <p className="mt-2 text-gray-200 whitespace-pre-wrap">
                {renderContentWithHashtags(post.share_comment)}
              </p>
            )}

            {/* Original post block (for shared posts) */}
            {isShared && originalPost && (
              <div className="mt-2 bg-gray-800 rounded-lg p-3 border-l-4 border-red-500">
                <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
                  <span>🔁 Shared from</span>
                  <Link href={`/profile/${originalPost.user?.id}`}>
                    <span className="font-semibold text-white hover:text-red-500 cursor-pointer">
                      @{originalPost.user?.username}
                    </span>
                  </Link>
                </div>
                <p className="text-gray-300">{originalPost.content}</p>
                {originalPost.media_urls && originalPost.media_urls.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {originalPost.media_urls.slice(0, 2).map((url, idx) => (
                      <img key={idx} src={url} className="rounded w-full h-32 object-cover" alt="media" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Media for non‑shared posts */}
            {!isShared && post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {post.media_urls.map((url, idx) => (
                  <img key={idx} src={url} alt="media" className="rounded-lg w-full h-48 object-cover" />
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-6 mt-3">
              <button onClick={handleLocalLike} disabled={isLiking} className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition">
                <span className="text-xl">❤️</span>
                <span>{likesCount}</span>
              </button>
              <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-1 text-gray-500 hover:text-secondary transition">
                <span className="text-xl">💬</span>
                <span>{post.comments_count || 0}</span>
              </button>
              <button onClick={() => setShowShareModal(true)} className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition">
                <span className="text-xl">↗️</span>
                <span>{post.shares_count || 0}</span>
              </button>
            </div>

            {showComments && <CommentSection postId={post.id} currentUser={currentUser} />}
          </div>
        </div>
      </div>

      <ShareModal
        post={post}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShareSuccess={(newSharePost) => {
          if (onShareSuccess) onShareSuccess(newSharePost);
          else window.location.reload(); // fallback
        }}
      />
      <EditPostModal post={post} isOpen={showEditModal} onClose={() => setShowEditModal(false)} onUpdate={onEdit} />
    </>
  );
}