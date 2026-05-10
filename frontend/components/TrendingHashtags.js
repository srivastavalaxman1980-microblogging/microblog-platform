import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FiTrendingUp } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

export default function TrendingHashtags() {
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const res = await axios.get(`${API_URL}/hashtags/trending`);
      setHashtags(res.data);
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading trends...</div>;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <FiTrendingUp className="text-red-500 text-xl" />
        <h3 className="text-white font-semibold">Trending Hashtags</h3>
      </div>
      {hashtags.length === 0 ? (
        <p className="text-gray-500 text-sm">No trending tags yet</p>
      ) : (
        <div className="space-y-2">
          {hashtags.map((tag, idx) => (
            <Link key={tag.tag} href={`/hashtag/${tag.tag}`}>
              <div className="flex justify-between items-center hover:bg-gray-800 p-2 rounded-lg cursor-pointer transition">
                <span className="text-red-400 text-sm">#{tag.tag}</span>
                <span className="text-gray-500 text-xs">{tag.post_count} posts</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}