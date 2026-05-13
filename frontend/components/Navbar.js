import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { FiHome, FiUser, FiLogOut, FiSearch, FiBell, FiMessageSquare, FiBarChart2, FiVolumeX, FiFolder, FiMenu, FiX } from 'react-icons/fi';
import NotificationBell from './NotificationBell';

export default function Navbar({ currentUser }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
    window.location.reload();
  };

  if (!currentUser) return null;

  // Navigation links for both desktop and mobile
  const navLinks = [
    { href: '/', label: 'Home', icon: FiHome },
    { href: '/search', label: 'Search', icon: FiSearch },
    { href: '/messages', label: 'Messages', icon: FiMessageSquare },
    { href: '/dashboard/analytics', label: 'Analytics', icon: FiBarChart2 },
    { href: '/settings/muted-keywords', label: 'Muted Words', icon: FiVolumeX },
    { href: '/settings/data', label: 'Data', icon: FiFolder },
    { href: `/profile/${currentUser.id}`, label: 'Profile', icon: FiUser },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Main Navbar */}
      <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-red-500 to-white bg-clip-text text-transparent">
              Aureon
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="text-gray-300 hover:text-red-500 transition flex items-center space-x-1">
                  <Icon className="text-xl" />
                  <span>{label}</span>
                </Link>
              ))}
              <NotificationBell currentUser={currentUser} />
              <button onClick={handleLogout} className="text-gray-300 hover:text-red-500 transition flex items-center space-x-1">
                <FiLogOut className="text-xl" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-gray-300 hover:text-red-500"
            >
              <FiMenu className="text-2xl" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer (sidebar) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-75" onClick={closeMobileMenu}></div>
          {/* Drawer content */}
          <div className="absolute right-0 top-0 h-full w-64 bg-gray-900 shadow-xl border-l border-gray-800 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <span className="text-white font-bold text-lg">Menu</span>
              <button onClick={closeMobileMenu} className="text-gray-400 hover:text-white">
                <FiX className="text-2xl" />
              </button>
            </div>
            <div className="flex flex-col space-y-4">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={closeMobileMenu}>
                  <div className="flex items-center space-x-3 text-gray-300 hover:text-red-500 transition cursor-pointer">
                    <Icon className="text-xl" />
                    <span>{label}</span>
                  </div>
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-800">
                <NotificationBell currentUser={currentUser} />
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
                className="flex items-center space-x-3 text-gray-300 hover:text-red-500 transition mt-4"
              >
                <FiLogOut className="text-xl" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}