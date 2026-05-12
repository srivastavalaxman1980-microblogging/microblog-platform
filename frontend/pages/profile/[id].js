import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { FiMessageSquare } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

export default function ProfilePage({ user: currentUser, isAuthenticated }) {
  const router = useRouter();
  const { id } = router.query;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '', bio: '', location: '', website: '', avatar_url: ''
  });
  const [activeTab, setActiveTab] = useState('posts');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchProfile();
      fetchBlockStatus();
    }
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
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/users/blocks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsBlocked(res.data.blocked.some(u => u.id === id));
      setIsMuted(res.data.muted.some(u => u.id === id));
    } catch (error) {
      console.error('Block status error:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      if (isFollowing) {
        await axios.delete(`${API_URL}/users/${id}/follow`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(false);
        toast.success('Unfollowed');
      } else {
        await axios.post(`${API_URL}/users/${id}/follow`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(true);
        toast.success('Followed');
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleBlock = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/users/${id}/block`, { type: 'block' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsBlocked(true);
      toast.success('User blocked');
    } catch (error) {
      toast.error('Failed to block');
    }
  };

  const handleUnblock = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/users/${id}/block?type=block`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsBlocked(false);
      toast.success('User unblocked');
    } catch (error) {
      toast.error('Failed to unblock');
    }
  };

  const handleMute = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/users/${id}/block`, { type: 'mute' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsMuted(true);
      toast.success('User muted');
    } catch (error) {
      toast.error('Failed to mute');
    }
  };

  const handleUnmute = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/users/${id}/block?type=mute`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsMuted(false);
      toast.success('User unmuted');
    } catch (error) {
      toast.error('Failed to unmute');
    }
  };

  const startConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/conversations`, { userId: profile.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push(`/messages/${response.data.id}`);
    } catch (error) {
      toast.error('Could not start conversation');
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/users/profile`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data.user);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const fetchFollowers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/users/${id}/followers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFollowers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/users/${id}/following`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFollowing(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'followers') await fetchFollowers();
    if (tab === 'following') await fetchFollowing();
  };

  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar currentUser={currentUser} />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar currentUser={currentUser} />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">User not found</div>
      </div>
    );
  }

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
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              {isOwnProfile ? (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditForm({
                      full_name: profile.full_name || '',
                      bio: profile.bio || '',
                      location: profile.location || '',
                      website: profile.website || '',
                      avatar_url: profile.avatar_url || ''
                    });
                  }}
                  className="border border-red-500 text-red-500 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-4 py-2 rounded-full transition ${
                      isFollowing
                        ? 'border border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  <button
                    onClick={startConversation}
                    className="border border-red-500 text-red-500 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition flex items-center gap-2"
                  >
                    <FiMessageSquare className="text-lg" /> Message
                  </button>
                  <button
                    onClick={isBlocked ? handleUnblock : handleBlock}
                    className={`px-4 py-2 rounded-full transition ${
                      isBlocked
                        ? 'border border-green-500 text-green-500 hover:bg-green-500 hover:text-white'
                        : 'border border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    {isBlocked ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    onClick={isMuted ? handleUnmute : handleMute}
                    className={`px-4 py-2 rounded-full transition ${
                      isMuted
                        ? 'border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white'
                        : 'border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white'
                    }`}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
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
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
                🔗 {profile.website}
              </a>
            )}
          </div>
          <div className="flex items-center space-x-6 mt-3 text-sm">
            <span><strong className="text-white">{profile.post_count || posts.length}</strong> Posts</span>
            <button
              onClick={() => handleTabChange('followers')}
              className={`hover:text-red-400 transition ${activeTab === 'followers' ? 'text-red-500' : 'text-gray-400'}`}
            >
              <strong className="text-white">{profile.followers_count || 0}</strong> Followers
            </button>
            <button
              onClick={() => handleTabChange('following')}
              className={`hover:text-red-400 transition ${activeTab === 'following' ? 'text-red-500' : 'text-gray-400'}`}
            >
              <strong className="text-white">{profile.following_count || 0}</strong> Following
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-800 mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => handleTabChange('posts')}
              className={`pb-3 px-1 font-medium transition ${
                activeTab === 'posts' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => handleTabChange('followers')}
              className={`pb-3 px-1 font-medium transition ${
                activeTab === 'followers' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Followers
            </button>
            <button
              onClick={() => handleTabChange('following')}
              className={`pb-3 px-1 font-medium transition ${
                activeTab === 'following' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Following
            </button>
          </div>
        </div>
        
        {/* Content */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                <p className="text-gray-500">No posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <p className="text-gray-200">{post.content}</p>
				  {post.is_pinned && (
                <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Pinned</span>
            )}
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
              <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                <p className="text-gray-500">No followers yet</p>
              </div>
            ) : (
              followers.map((follower) => (
                <div key={follower.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                      {follower.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{follower.full_name || follower.username}</p>
                      <p className="text-sm text-gray-500">@{follower.username}</p>
                    </div>
                  </div>
                  <button onClick={() => router.push(`/profile/${follower.id}`)} className="text-red-500 hover:underline text-sm">
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'following' && (
          <div className="space-y-3">
            {following.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                <p className="text-gray-500">Not following anyone yet</p>
              </div>
            ) : (
              following.map((followed) => (
                <div key={followed.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                      {followed.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{followed.full_name || followed.username}</p>
                      <p className="text-sm text-gray-500">@{followed.username}</p>
                    </div>
                  </div>
                  <button onClick={() => router.push(`/profile/${followed.id}`)} className="text-red-500 hover:underline text-sm">
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl w-full max-w-md p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white text-2xl">✕</button>
            </div>
            <form onSubmit={handleEditProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows="3"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="Tell us about yourself..."
                  maxLength="160"
                />
                <span className="text-xs text-gray-500">{editForm.bio.length}/160</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Avatar URL</label>
                <input
                  type="url"
                  value={editForm.avatar_url}
                  onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="https://..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-600">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}