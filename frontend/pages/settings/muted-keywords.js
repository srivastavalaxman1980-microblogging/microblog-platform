import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

export default function MutedKeywordsPage({ isAuthenticated, user }) {
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) fetchKeywords();
  }, [isAuthenticated]);

  const fetchKeywords = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/muted-keywords`);
      setKeywords(res.data);
    } catch (error) {
      toast.error('Failed to load muted keywords');
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    try {
      await axios.post(`${API_URL}/users/muted-keywords`, { keyword: newKeyword.trim() });
      toast.success('Keyword muted');
      setNewKeyword('');
      fetchKeywords();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add');
    }
  };

  const removeKeyword = async (keyword) => {
    if (!confirm(`Unmute "${keyword}"?`)) return;
    try {
      await axios.delete(`${API_URL}/users/muted-keywords/${encodeURIComponent(keyword)}`);
      toast.success('Keyword unmuted');
      fetchKeywords();
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-black">
      <Navbar currentUser={user} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-6">Muted Keywords</h1>
        <p className="text-gray-400 mb-4">Posts or comments containing these words will be hidden from your feed.</p>
        <form onSubmit={addKeyword} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="e.g., spoiler, politics"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
            maxLength="100"
          />
          <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600">Mute</button>
        </form>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : keywords.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
            <p className="text-gray-500">No muted keywords. Add some to filter your feed.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keywords.map(kw => (
              <div key={kw} className="bg-gray-900 rounded-xl border border-gray-800 p-3 flex justify-between items-center">
                <span className="text-white">{kw}</span>
                <button onClick={() => removeKeyword(kw)} className="text-red-500 hover:text-red-400">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}