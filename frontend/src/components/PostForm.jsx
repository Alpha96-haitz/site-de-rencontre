import { useState } from 'react';
import { FiImage, FiSend, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PostForm({ onPostCreated }) {
  const { user } = useAuth();
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("L'image est trop lourde (max 5MB)");
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desc.trim() && !image) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('desc', desc);
      if (image) {
        formData.append('image', image);
      }

      const { data } = await client.post('/posts', formData, { timeout: 60000 });
      
      setDesc('');
      setImage(null);
      setPreview('');
      toast.success('Publication réussie');
      if (onPostCreated) onPostCreated(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  const primaryPhoto = user?.photos?.find((p) => p.isPrimary) || user?.photos?.[0];
  const avatarUrl = primaryPhoto?.url || user?.googlePhoto || 'https://placehold.co/150';

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 transition-all focus-within:shadow-md">
      <div className="flex gap-4">
        <img src={avatarUrl} alt="Avatar" className="w-11 h-11 rounded-full object-cover border border-slate-100" />
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={`Quoi de neuf, ${user?.firstName} ?`}
            className="w-full bg-slate-50 border-none focus:ring-0 rounded-2xl resize-none p-3 outline-none text-slate-700 placeholder:text-slate-400"
            rows="2"
          />
          
          {preview && (
            <div className="relative mt-3 group">
              <img src={preview} alt="Aperçu" className="rounded-2xl w-full max-h-80 object-cover border border-slate-100" />
              <button 
                type="button" 
                onClick={() => { setImage(null); setPreview(''); }}
                className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors shadow-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
            <div className="flex gap-1">
              <label className="flex items-center gap-2 text-slate-500 hover:text-pink-600 hover:bg-pink-50 px-3 py-2 rounded-xl cursor-pointer transition-all font-bold text-xs uppercase tracking-wider">
                <FiImage className="w-5 h-5" />
                <span>Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                  disabled={loading}
                />
              </label>
            </div>
            <button 
              type="submit" 
              disabled={loading || (!desc.trim() && !image)}
              className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-pink-100 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? "Envoi..." : <><FiSend className="w-4 h-4" /> Publier</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
