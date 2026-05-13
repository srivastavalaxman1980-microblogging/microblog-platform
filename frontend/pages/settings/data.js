import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

export default function DataManagementPage({ isAuthenticated, user }) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/user/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `aureon-data-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('importFile', file);
    setImporting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/user/import`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Import completed');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-black">
      <Navbar currentUser={user} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Data Management</h1>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-6">
          {/* Export */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Export Your Data</h2>
            <p className="text-gray-400 mb-4">Download all your posts, comments, likes, and profile information as a JSON file (GDPR compliant).</p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-600 disabled:opacity-50"
            >
              {exporting ? 'Preparing...' : 'Export Data'}
            </button>
          </div>

          {/* Import */}
          <div className="pt-4 border-t border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-2">Import Data</h2>
            <p className="text-gray-400 mb-4">Restore posts and comments from a previously exported Aureon JSON file.</p>
            <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-full inline-block">
              {importing ? 'Importing...' : 'Choose File to Import'}
              <input type="file" accept=".json" onChange={handleImport} disabled={importing} className="hidden" />
            </label>
          </div>

          {/* Twitter Import (placeholder) */}
          <div className="pt-4 border-t border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-2">Import from Twitter</h2>
            <p className="text-gray-400 mb-4">Coming soon: import your tweets and media from Twitter (requires Twitter authentication).</p>
            <button disabled className="bg-gray-700 text-gray-400 px-6 py-2 rounded-full cursor-not-allowed">
              Twitter Import (beta)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}