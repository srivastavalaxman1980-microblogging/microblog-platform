// frontend/pages/profile/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { FiMessageSquare, FiUserPlus, FiUserMinus } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

export default function ProfilePage({ user: currentUser, isAuthenticated }) {
  const router = useRouter();
  const { id } = router.query;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', location: '', website: '', avatar_url: '' });
  const [activeTab, setActiveTab] = useState('posts');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    if (id && isAuthenticated) { fetchProfile(); }
  }, [id, isAuthenticated]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data.user);
      setPosts(response.data.recentPosts || []);
      setIsFollowing(response.data.isFollowing || false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally { setLoading(false); }
  };

  const handleFollow = async () => {
    // ... follow logic ...
  };

  const handleEditProfile = async (e) => { /* ... edit logic ... */ };
  const handleTabChange = async (tab) => { /* ... tab logic ... */ };
  const fetchFollowers = async () => { /* ... */ };
  const fetchFollowing = async () => { /* ... */ };

  // Function to start a conversation
  const startConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/conversations`, { userId: profile.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push(`/messages/${response.data.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Could not start conversation');
    }
  };

  if (!isAuthenticated) { router.push('/'); return null; }
  if (loading) { return <div className="min-h-screen bg-black"><Navbar currentUser={currentUser} /><div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">Loading profile...</div></div>; }
  if (!profile) { return <div className="min-h-screen bg-black"><Navbar currentUser={currentUser} /><div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">User not found</div></div>; }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-black">
      <Navbar currentUser={currentUser} />
      
      {/* Cover Photo */}
      <div className="h-48 bg-gradient-to-r from-red-600 to-blue-600 relative">
        {profile.cover_photo_url && <img src={profile.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />}
      </div>
      
      <div className="max-w-3xl mx-auto px-4">
        <div className="relative -mt-16 mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div className="flex items-end space-x-4">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full border-4 border-black bg-gray-800 overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold bg-red-600">
                    {profile.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-white">{profile.full_name || profile.username}</h1>
                <p className="text-gray-400">@{profile.username}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-4 md:mt-0 flex gap-2">
              {isOwnProfile ? (
                <button onClick={() => { setIsEditing(true); setEditForm({ full_name: profile.full_name || '', bio: profile.bio || '', location: profile.location || '', website: profile.website || '', avatar_url: profile.avatar_url || '' }); }} className="border border-red-500 text-red-500 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition">
                  Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={handleFollow} className={`px-4 py-2 rounded-full transition ${isFollowing ? 'border border-red-500 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  {/* ✅ FIXED: Message button with onClick function */}
                  <button
                    onClick={startConversation}
                    className="border border-red-500 text-red-500 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition flex items-center gap-2"
                  >
                    <FiMessageSquare className="text-lg" /> Message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Bio Section */}
        <div className="mb-6">
          {profile.bio && <p className="text-gray-300">{profile.bio}</p>}
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            {profile.location && <span>📍 {profile.location}</span>}
            {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">🔗 {profile.website}</a>}
          </div>
          <div className="flex items-center space-x-6 mt-3 text-sm">
            <span><strong className="text-white">{profile.post_count || posts.length}</strong> Posts</span>
            <button onClick={() => handleTabChange('followers')} className={`hover:text-red-400 transition ${activeTab === 'followers' ? 'text-red-500' : 'text-gray-400'}`}>
              <strong className="text-white">{profile.followers_count || 0}</strong> Followers
            </button>
            <button onClick={() => handleTabChange('following')} className={`hover:text-red-400 transition ${activeTab === 'following' ? 'text-red-500' : 'text-gray-400'}`}>
              <strong className="text-white">{profile.following_count || 0}</strong> Following
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-800 mb-6">
          <div className="flex space-x-8">
            <button onClick={() => handleTabChange('posts')} className={`pb-3 px-1 font-medium transition ${activeTab === 'posts' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-gray-300'}`}>Posts</button>
            <button onClick={() => handleTabChange('followers')} className={`pb-3 px-1 font-medium transition ${activeTab === 'followers' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-gray-300'}`}>Followers</button>
            <button onClick={() => handleTabChange('following')} className={`pb-3 px-1 font-medium transition ${activeTab === 'following' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-gray-300'}`}>Following</button>
          </div>
        </div>
        
        {/* Content */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800"><p className="text-gray-500">No posts yet</p></div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <p className="text-gray-200">{post.content}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <span>❤️ {post.likes_count || 0}</span>
                    <span>💬 {post.comments_count || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'followers' && (
          <div className="space-y-3">
            {followers.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800"><p className="text-gray-500">No followers yet</p></div>
            ) : (
              followers.map((follower) => (
                <div key={follower.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">{follower.username?.charAt(0).toUpperCase()}</div>
                    <div><p className="font-semibold text-white">{follower.full_name || follower.username}</p><p className="text-sm text-gray-500">@{follower.username}</p></div>
                  </div>
                  <button onClick={() => router.push(`/profile/${follower.id}`)} className="text-red-500 hover:underline text-sm">View</button>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'following' && (
          <div className="space-y-3">
            {following.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800"><p className="text-gray-500">Not following anyone yet</p></div>
            ) : (
              following.map((followed) => (
                <div key={followed.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">{followed.username?.charAt(0).toUpperCase()}</div>
                    <div><p className="font-semibold text-white">{followed.full_name || followed.username}</p><p className="text-sm text-gray-500">@{followed.username}</p></div>
                  </div>
                  <button onClick={() => router.push(`/profile/${followed.id}`)} className="text-red-500 hover:underline text-sm">View</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Edit Profile Modal */}
      {isEditing && ( /* ... modal JSX ... */ )}
    </div>
  );
}