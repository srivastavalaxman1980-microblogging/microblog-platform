import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import '../styles/globals.css';
import { useEffect } from 'react';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

function MyApp({ Component, pageProps }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);
  
  useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('Service Worker registered', reg);
    }).catch(err => console.error('SW registration failed:', err));
  }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-red-500 text-xl animate-pulse">Aureon</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Aureon – Connect, share, discover</title>
        <meta name="description" content="A modern social platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { background: '#1A1A1A', color: '#fff', border: '1px solid #333' },
          success: { iconTheme: { primary: '#FF3B30', secondary: '#fff' } }
        }} 
      />
      <Component 
        {...pageProps} 
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
        user={user}
        setUser={setUser}
      />
    </>
  );
}

export default MyApp;