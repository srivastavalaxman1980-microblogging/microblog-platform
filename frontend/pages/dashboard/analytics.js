import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Navbar from '../../components/Navbar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

export default function AnalyticsDashboard({ isAuthenticated, user }) {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [followerData, setFollowerData] = useState([]);
  const [bestTimes, setBestTimes] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserAnalytics();
      fetchUserPosts();
    }
  }, [isAuthenticated]);

  const fetchUserAnalytics = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/analytics`);
      setFollowerData(res.data.follower_growth);
      setBestTimes(res.data.best_times);
    } catch (error) {
      toast.error('Failed to load analytics');
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts/feed`); // get user's own posts? Better: endpoint for user's posts only
      setPosts(res.data.posts.filter(p => p.user_id === user.id));
      // For each post, fetch detailed analytics
      const analyticsData = {};
      for (const post of res.data.posts.filter(p => p.user_id === user.id)) {
        try {
          const analyticsRes = await axios.get(`${API_URL}/posts/${post.id}/analytics`);
          analyticsData[post.id] = analyticsRes.data;
        } catch (err) {}
      }
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;
  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading analytics...</div>;

  // Prepare chart data
  const followerChartData = {
    labels: followerData.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Followers',
        data: followerData.map(d => d.count),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const bestHourData = {
    labels: bestTimes.hours?.map(h => `${h.hour}:00`) || [],
    datasets: [
      {
        label: 'Average Engagement',
        data: bestTimes.hours?.map(h => h.avgEngagement) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar currentUser={user} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
        
        {/* Follower Growth Chart */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Follower Growth</h2>
          {followerData.length > 0 ? (
            <Line data={followerChartData} options={{ responsive: true }} />
          ) : (
            <p className="text-gray-500">Not enough data yet. Check back tomorrow.</p>
          )}
        </div>

        {/* Best Time to Post */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Best Hours (avg engagement)</h2>
            {bestTimes.hours?.length > 0 ? (
              <Bar data={bestHourData} options={{ responsive: true }} />
            ) : (
              <p className="text-gray-500">Not enough data yet.</p>
            )}
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Best Days (total engagement)</h2>
            {bestTimes.days?.length > 0 ? (
              <ul className="space-y-2">
                {bestTimes.days.map(({ day, totalEngagement }) => (
                  <li key={day} className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]}</span>
                    <span className="text-red-400 font-semibold">{totalEngagement} engagements</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Not enough data yet.</p>
            )}
          </div>
        </div>

        {/* Posts Analytics Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-semibold mb-4">Your Posts Performance</h2>
          {posts.length === 0 ? (
            <p className="text-gray-500">You haven't posted anything yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2">Post</th>
                    <th className="text-left py-2">Views</th>
                    <th className="text-left py-2">Likes</th>
                    <th className="text-left py-2">Comments</th>
                    <th className="text-left py-2">Shares</th>
                    <th className="text-left py-2">Engagement Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => {
                    const a = analytics[post.id] || {};
                    return (
                      <tr key={post.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                        <td className="py-2 truncate max-w-xs">{post.content.substring(0, 50)}...</td>
                        <td className="py-2">{a.views || 0}</td>
                        <td className="py-2">{a.engagement?.likes || 0}</td>
                        <td className="py-2">{a.engagement?.comments || 0}</td>
                        <td className="py-2">{a.engagement?.shares || 0}</td>
                        <td className="py-2">{a.engagement?.engagement_rate?.toFixed(1) || 0}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}