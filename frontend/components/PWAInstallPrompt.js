import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowInstall(false);
      });
    }
  };
  
  const subscribeToPush = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
    });
    await axios.post(`${API_URL}/push/subscribe`, { subscription }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  }
};

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/icons/icon-72x72.png" alt="Aureon" className="w-12 h-12 rounded-xl" />
          <div>
            <h3 className="text-white font-semibold">Install Aureon</h3>
            <p className="text-gray-400 text-sm">Add to home screen</p>
          </div>
        </div>
        <button
          onClick={handleInstall}
          className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-600"
        >
          Install
        </button>
      </div>
      <button
        onClick={() => setShowInstall(false)}
        className="absolute top-2 right-2 text-gray-500 hover:text-white text-xs"
      >
        ✕
      </button>
    </div>
  );
}