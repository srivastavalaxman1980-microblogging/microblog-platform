import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBell } from 'react-icons/fi';
import io from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';
let socket;

export default function NotificationBell({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      setupSocket();
    }
    return () => { if (socket) socket.disconnect(); };
  }, [currentUser]);

  const setupSocket = () => {
    socket = io('https://microblog-backend-1jv9.onrender.com', { transports: ['websocket'] });
    const token = localStorage.getItem('token');
    socket.emit('authenticate', token);
    socket.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(c => c + 1);
      if (Notification.permission === 'granted') {
        new Notification('MicroBlog', { body: notif.content });
      }
    });
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (error) { console.error(error); }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(c => c - 1);
    } catch (error) { console.error(error); }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="relative">
      <button onClick={() => setShowDropdown(!showDropdown)} className="relative text-gray-600 hover:text-primary">
        <FiBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border max-h-96 overflow-y-auto">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-primary">Mark all read</button>}
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No notifications</div>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notif.is_read ? 'bg-blue-50' : ''}`} onClick={() => markAsRead(notif.id)}>
                <p className="text-sm text-gray-800">{notif.content}</p>
                <span className="text-xs text-gray-400">{new Date(notif.created_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}