import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

export default function SearchPage({ isAuthenticated, user }) {
  const router = useRouter();
  const { q } = router.query;
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(q || '');

  useEffect(() => {
    if (q && q.trim()) {
      performSearch();
    }
  }, [q]);

  const performSearch = async () => {
    if (!q || !q.trim()) return;
    setLoading(true);
    try {
      if (activeTab === 'posts') {
        const res = await axios.get(`${API_URL}/search/posts`, { params: { q } });
        setPosts(res.data.posts || []);
      } else {
        const res = await axios.get(`${API_URL}/search/users`, { params: { q } });
        setUsers(res.data.users || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
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
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts or users..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              className="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-600"
            >
              Search
            </button>
          </div>
        </form>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-6">
          <button
            onClick={() => { setActiveTab('posts'); if (q) performSearch(); }}
            className={`pb-3 px-4 font-medium transition ${activeTab === 'posts' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
          >
            Posts
          </button>
          <button
            onClick={() => { setActiveTab('users'); if (q) performSearch(); }}
            className={`pb-3 px-4 font-medium transition ${activeTab === 'users' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}`}
          >
            Users
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Searching...</div>
        ) : (
          <>
            {activeTab === 'posts' && (
              <>
                {posts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                    <p className="text-gray-500">No posts found for "{q}"</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={() => {}} // dummy, actual like would need handler
                        onDelete={() => {}}
                        onEdit={() => {}}
                        currentUser={user}
                        onShareSuccess={() => {}}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'users' && (
              <>
                {users.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                    <p className="text-gray-500">No users found for "{q}"</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map(userResult => (
                      <div key={userResult.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {userResult.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link href={`/profile/${userResult.id}`}>
                              <span className="font-semibold text-white hover:text-red-500 cursor-pointer">
                                {userResult.full_name || userResult.username}
                              </span>
                            </Link>
                            <p className="text-sm text-gray-500">@{userResult.username}</p>
                            {userResult.bio && <p className="text-sm text-gray-400 mt-1 line-clamp-1">{userResult.bio}</p>}
                          </div>
                        </div>
                        <Link href={`/profile/${userResult.id}`}>
                          <span className="text-red-500 hover:underline text-sm cursor-pointer">View</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}