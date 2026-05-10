import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiHome, FiUser, FiLogOut, FiBell, FiMessageSquare, FiTrendingUp, FiBookmark } from 'react-icons/fi';
import NotificationBell from './NotificationBell';

export default function Navbar({ currentUser }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
    window.location.reload();
  };

  if (!currentUser) return null;

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
            Aureon
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-300 hover:text-red-500 transition flex items-center space-x-2">
              <FiHome className="text-xl" />
              <span>Home</span>
            </Link>
            <Link href="/explore" className="text-gray-300 hover:text-red-500 transition flex items-center space-x-2">
              <FiTrendingUp className="text-xl" />
              <span>Explore</span>
            </Link>
            <Link href="/bookmarks" className="text-gray-300 hover:text-red-500 transition flex items-center space-x-2">
              <FiBookmark className="text-xl" />
              <span>Bookmarks</span>
            </Link>
            <Link href="/messages" className="text-gray-300 hover:text-red-500 transition flex items-center space-x-2">
              <FiMessageSquare className="text-xl" />
              <span>Messages</span>
            </Link>
            <NotificationBell currentUser={currentUser} />
            <Link href={`/profile/${currentUser.id}`} className="text-gray-300 hover:text-red-500 transition flex items-center space-x-2">
              <FiUser className="text-xl" />
              <span>Profile</span>
            </Link>
            <button onClick={handleLogout} className="text-gray-300 hover:text-red-500 transition flex items-center space-x-2">
              <FiLogOut className="text-xl" />
              <span>Logout</span>
            </button>
          </div>
          
          {/* Mobile menu button (simplified) */}
          <div className="md:hidden flex items-center space-x-4">
            <NotificationBell currentUser={currentUser} />
            <button onClick={handleLogout} className="text-gray-300 hover:text-red-500">
              <FiLogOut className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}