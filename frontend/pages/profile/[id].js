import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

// Get API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

export default function ProfilePage({ user: currentUser, isAuthenticated }) {
  const router = useRouter();
  const { id } = router.query;
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    location: '',
    website: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchProfile();
    }
  }, [id, isAuthenticated]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        toast.error('Please login first');
        router.push('/');
        return;
      }
      
      console.log('Fetching profile for ID:', id);
      console.log('API_URL:', API_URL);
      
      const response = await axios.get(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Profile response:', response.data);
      setProfile(response.data.user);
      setPosts(response.data.recentPosts || []);
      setIsFollowing(response.data.isFollowing || false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        toast.error(error.response.data?.error || 'Failed to load profile');
      } else if (error.request) {
        console.error('No response from server');
        toast.error('Cannot connect to server. Please try again.');
      } else {
        toast.error('Error loading profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/${id}/followers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFollowers(response.data);
    } catch (error) {
      console.error('Error fetching followers:', error);
      toast.error('Failed to load followers');
    }
  };

  const fetchFollowing = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/${id}/following`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFollowing(response.data);
    } catch (error) {
      console.error('Error fetching following:', error);
      toast.error('Failed to load following');
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      if (isFollowing) {
        await axios.delete(`${API_URL}/users/${id}/follow`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Unfollowed user');
        setIsFollowing(false);
        setProfile(prev => prev ? { ...prev, followers_count: (prev.followers_count || 1) - 1 } : prev);
      } else {
        await axios.post(`${API_URL}/users/${id}/follow`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Now following user');
        setIsFollowing(true);
        setProfile(prev => prev ? { ...prev, followers_count: (prev.followers_count || 0) + 1 } : prev);
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error(error.response?.data?.error || 'Action failed');
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
      toast.success('Profile updated successfully!');
      
      // Update current user in localStorage
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        storedUser.full_name = response.data.user.full_name;
        localStorage.setItem('user', JSON.stringify(storedUser));
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'followers') {
      await fetchFollowers();
    } else if (tab === 'following') {
      await fetchFollowing();
    }
  };

  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentUser={currentUser} />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentUser={currentUser} />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="text-gray-500">User not found</div>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-primary text-white px-4 py-2 rounded-full hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUser={currentUser} />
      
      {/* Cover Photo */}
      <div className="h-48 bg-gradient-to-r from-primary to-blue-600 relative">
        {profile.cover_photo_url && (
          <img src={profile.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>
      
      <div className="max-w-3xl mx-auto px-4">
        {/* Profile Header */}
        <div className="relative -mt-16 mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div className="flex items-end space-x-4">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                    {profile.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.full_name || profile.username}</h1>
                <p className="text-gray-500">@{profile.username}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-4 md:mt-0">
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
                  className="border border-primary text-primary px-6 py-2 rounded-full hover:bg-primary hover:text-white transition"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-full transition ${
                    isFollowing 
                      ? 'border border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                      : 'bg-primary text-white hover:bg-blue-600'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Bio Section */}
        <div className="mb-6">
          {profile.bio && <p className="text-gray-800">{profile.bio}</p>}
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            {profile.location && (
              <span>📍 {profile.location}</span>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                🔗 {profile.website}
              </a>
            )}
          </div>
          <div className="flex items-center space-x-6 mt-3 text-sm">
            <span><strong>{profile.post_count || posts.length}</strong> Posts</span>
            <button 
              onClick={() => handleTabChange('followers')}
              className={`hover:text-primary transition ${activeTab === 'followers' ? 'text-primary' : 'text-gray-600'}`}
            >
              <strong>{profile.followers_count || 0}</strong> Followers
            </button>
            <button 
              onClick={() => handleTabChange('following')}
              className={`hover:text-primary transition ${activeTab === 'following' ? 'text-primary' : 'text-gray-600'}`}
            >
              <strong>{profile.following_count || 0}</strong> Following
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => handleTabChange('posts')}
              className={`pb-3 px-1 font-medium transition ${
                activeTab === 'posts' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => handleTabChange('followers')}
              className={`pb-3 px-1 font-medium transition ${
                activeTab === 'followers' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Followers
            </button>
            <button
              onClick={() => handleTabChange('following')}
              className={`pb-3 px-1 font-medium transition ${
                activeTab === 'following' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700'
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
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {profile.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{profile.full_name || profile.username}</p>
                      <p className="text-xs text-gray-500">@{profile.username}</p>
                    </div>
                  </div>
                  <p className="text-gray-800">{post.content}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <span>❤️ {post.likes_count || 0}</span>
                    <span>💬 {post.comments_count || 0}</span>
                    <span className="text-xs">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'followers' && (
          <div className="space-y-3">
            {followers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No followers yet</p>
              </div>
            ) : (
              followers.map((follower) => (
                <div key={follower.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      {follower.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{follower.full_name || follower.username}</p>
                      <p className="text-sm text-gray-500">@{follower.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/profile/${follower.id}`)}
                    className="text-primary hover:underline text-sm"
                  >
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
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">Not following anyone yet</p>
              </div>
            ) : (
              following.map((followed) => (
                <div key={followed.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      {followed.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{followed.full_name || followed.username}</p>
                      <p className="text-sm text-gray-500">@{followed.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/profile/${followed.id}`)}
                    className="text-primary hover:underline text-sm"
                  >
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <form onSubmit={handleEditProfile} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  maxLength="160"
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-primary resize-none"
                  placeholder="Tell us about yourself..."
                />
                <span className="text-xs text-gray-500">{editForm.bio.length}/160</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-primary"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-primary"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                <input
                  type="url"
                  value={editForm.avatar_url}
                  onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-primary"
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-700">
                  Cancel
                </button>
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-full hover:bg-blue-600">
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