import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import Navbar from '../../components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';
let socket;

export default function ChatPage({ isAuthenticated, user }) {
  const router = useRouter();
  const { id: conversationId } = router.query;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && conversationId) {
      fetchMessages();
      setupSocket();
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, [conversationId, isAuthenticated]);

  const setupSocket = () => {
    socket = io(API_URL.replace('/api', ''), { transports: ['websocket'] });
    const token = localStorage.getItem('token');
    socket.emit('authenticate', token);
    socket.on('new_message', (msg) => {
      if (msg.conversation_id === conversationId) {
        setMessages((prev) => [...prev, msg]);
      }
    });
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/conversations/${conversationId}/messages`);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/messages`, {
        conversationId,
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar currentUser={user} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 h-[80vh] flex flex-col">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender_id === user.id ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                    <p>{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={sendMessage} className="border-t border-gray-800 p-4 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
              maxLength="500"
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}