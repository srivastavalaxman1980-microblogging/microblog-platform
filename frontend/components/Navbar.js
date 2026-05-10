import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiHome, FiUser, FiLogOut } from 'react-icons/fi';
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
    <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary hover:text-blue-600">
            MicroBlog
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-primary">
              <FiHome className="text-xl" />
            </Link>
            <NotificationBell currentUser={currentUser} />
            <Link href={`/profile/${currentUser.id}`} className="text-gray-600 hover:text-primary">
              <FiUser className="text-xl" />
            </Link>
            <button onClick={handleLogout} className="text-gray-600 hover:text-red-500">
              <FiLogOut className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}