import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import PostCard from '../../components/PostCard'; // We'll export PostCard separately or redefine
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

export default function HashtagPage({ isAuthenticated, user, setIsAuthenticated, setUser }) {
  const router = useRouter();
  const { tag } = router.query;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hashtagInfo, setHashtagInfo] = useState(null);

  useEffect(() => {
    if (tag) {
      fetchPosts();
    }
  }, [tag]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/hashtags/${tag}/posts`);
      setPosts(res.data.posts || []);
      setHashtagInfo({ tag: res.data.tag, count: res.data.count });
    } catch (error) {
      console.error('Error fetching hashtag posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar currentUser={user} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">#{hashtagInfo?.tag || tag}</h1>
          <p className="text-gray-500">{hashtagInfo?.count || 0} posts</p>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
            <p className="text-gray-500">No posts with #{tag} yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                onLike={() => {}}
                onDelete={() => {}}
                onEdit={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}