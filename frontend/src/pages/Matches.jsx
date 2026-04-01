import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [likes, setLikes] = useState([]);
  const [tab, setTab] = useState('matches');

  useEffect(() => {
    client.get('/matches').then((r) => setMatches(r.data));
    client.get('/matches/likes-received').then((r) => setLikes(r.data));
  }, []);

  const list = tab === 'matches' ? matches : likes;
  const getPhotoUrl = (item) => {
    const u = item.matchedUser || item.likedBy;
    const photo = u?.photos?.find((p) => p.isPrimary) || u?.photos?.[0];
    return photo?.url || u?.googlePhoto;
  };
  const getName = (item) => (item.matchedUser || item.likedBy)?.firstName || 'Inconnu';
  const getLink = (item) => {
    if (item.matchedUser) return `/messages/${item._id}`;
    return null;
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Matches et Likes</h1>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('matches')}
          className={`px-4 py-2 rounded-lg font-medium ${tab === 'matches' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Matches ({matches.length})
        </button>
        <button
          onClick={() => setTab('likes')}
          className={`px-4 py-2 rounded-lg font-medium ${tab === 'likes' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Likes recus ({likes.length})
        </button>
      </div>
      <div className="space-y-2">
        {list.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Aucun pour le moment.</p>
        ) : (
          list.map((item) => {
            const photoUrl = getPhotoUrl(item);
            const link = getLink(item);
            const El = link ? Link : 'div';
            const props = link ? { to: link } : {};
            return (
              <El key={item._id} {...props} className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm hover:bg-slate-50">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 shrink-0">
                  {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">?</div>}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{getName(item)}</p>
                  {item.matchedAt && <p className="text-xs text-slate-500">Match</p>}
                </div>
              </El>
            );
          })
        )}
      </div>
    </div>
  );
}
