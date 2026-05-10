import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://microblog-backend-1jv9.onrender.com/api';

export default function ImageUploader({ onImagesUploaded, maxImages = 4 }) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > maxImages) {
      toast.error(`Max ${maxImages} images`);
      return;
    }
    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/upload/multiple`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      const newImages = [...images, ...res.data.images];
      setImages(newImages);
      onImagesUploaded(newImages);
      toast.success('Uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index, publicId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/upload/${publicId}`, { headers: { Authorization: `Bearer ${token}` } });
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      onImagesUploaded(newImages);
      toast.success('Removed');
    } catch (err) {
      toast.error('Remove failed');
    }
  };

  return (
    <div className="mt-3">
      <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full inline-block">
        📷 Add Images
        <input type="file" multiple accept="image/*" onChange={handleFileSelect} disabled={uploading} className="hidden" />
      </label>
      {uploading && <span className="ml-2 text-sm text-gray-500">Uploading...</span>}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img src={img.url} className="w-16 h-16 object-cover rounded" alt="preview" />
              <button onClick={() => removeImage(i, img.public_id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}