import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-pink-600 mb-6">
          ← Retour à l'accueil
        </Link>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-4xl font-black text-slate-900 mb-6">Contact</h1>
          <p className="text-slate-700 leading-relaxed mb-6">
            Pour toute question, suggestion ou support, contactez notre équipe dédiée. Nous sommes là pour vous aider.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-slate-200 p-6 bg-slate-50">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4">
                <FiMail className="text-pink-500 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Email</h2>
              <p className="text-slate-600">support@haitz.com</p>
            </div>
            <div className="rounded-3xl border border-slate-200 p-6 bg-slate-50">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4">
                <FiPhone className="text-pink-500 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Téléphone</h2>
              <p className="text-slate-600">+224 621 95 65 96</p>
            </div>
            <div className="rounded-3xl border border-slate-200 p-6 bg-slate-50">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4">
                <FiMapPin className="text-pink-500 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Adresse</h2>
              <p className="text-slate-600">Conakry, Guinée<br/>Seydou Nourou Tall</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
