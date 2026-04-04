import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { FiArrowRight, FiArrowLeft, FiCamera, FiCheck, FiUser, FiMail, FiLock, FiCalendar, FiMapPin } from 'react-icons/fi';
import logo from '../assets/logo.png';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    city: ''
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!form.username || !form.email || !form.password) return toast.error('Veuillez remplir tous les champs');
      if (/\s/.test(form.username)) return toast.error("Le nom d'utilisateur ne doit pas contenir d'espaces");
      if (form.username.length < 3) return toast.error('Le nom d\'utilisateur doit faire au moins 3 caractères');
      if (form.password.length < 6) return toast.error('Le mot de passe doit faire au moins 6 caractères');
    }
    if (step === 2) {
      if (!form.firstName || !form.lastName || !form.birthDate || !form.city || !form.gender) return toast.error('Veuillez remplir toutes les informations');
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const signupData = {
        ...form,
        location: { city: form.city }
      };
      
      const data = await signup(signupData);
      
      if (photo) {
        const formData = new FormData();
        formData.append('photo', photo);
        try {
          await client.post('/users/photos', formData);
        } catch (photoErr) {
          console.error("Erreur upload photo:", photoErr);
        }
      }
      
      toast.success('Bienvenue sur HAITZ-RENCONTRE !');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success('Connexion réussie !');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 transition-all duration-500 relative overflow-hidden">
        
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-pink-600 transition-all font-bold text-xs uppercase tracking-widest mb-8">
           <FiArrowLeft className="text-lg" /> Retour à l'accueil
        </Link>

        <div className="text-center mb-6">
          <img src={logo} alt="HAITZ" className="h-24 md:h-32 object-contain mx-auto mb-2" />
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-pink-500' : 'w-3 bg-slate-200'}`}
              />
            ))}
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {step === 1 && "Créer votre compte"}
            {step === 2 && "Parlez-nous de vous"}
            {step === 3 && "Ajoutez une photo"}
            {step === 4 && "Vérification finale"}
          </h2>
        </div>

        {/* Etape 1 */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
            <div className="relative">
              <FiUser className="absolute left-3 top-3 text-slate-400" />
              <input name="username" placeholder="Nom d'utilisateur" value={form.username} onChange={handleChange} required pattern="^[a-zA-Z0-9_]+$" title="Sans espaces, seulement lettres, chiffres et underscores" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" />
            </div>
            <div className="relative">
              <FiMail className="absolute left-3 top-3 text-slate-400" />
              <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" />
            </div>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-slate-400" />
              <input name="password" type="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" />
            </div>
            <button onClick={nextStep} className="w-full py-4 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200 flex items-center justify-center gap-2">
              Suivant <FiArrowRight />
            </button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-400">Ou s'inscrire avec</span></div>
            </div>
            <GoogleLoginButton onSuccess={handleGoogleSuccess} />
          </div>
        )}

        {/* Etape 2 */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
            <div className="grid grid-cols-2 gap-4">
              <input name="firstName" placeholder="Prénom" value={form.firstName} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" />
              <input name="lastName" placeholder="Nom" value={form.lastName} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" />
            </div>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-3 text-slate-400" />
              <input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" />
            </div>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-3 text-slate-400" />
              <input name="city" placeholder="Ville" value={form.city} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" />
            </div>
            <select name="gender" value={form.gender} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none bg-white">
              <option value="">-- Sélectionnez votre genre --</option>
              <option value="male">Homme</option>
              <option value="female">Femme</option>
              <option value="other">Autre</option>
            </select>
            <div className="flex gap-3 pt-4">
              <button onClick={prevStep} className="flex-1 py-4 border-2 border-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50"><FiArrowLeft /> Retour</button>
              <button onClick={nextStep} className="flex-1 py-4 bg-pink-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">Suivant <FiArrowRight /></button>
            </div>
          </div>
        )}

        {/* Etape 3 */}
        {step === 3 && (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-right duration-300">
            <div className="relative inline-block mx-auto">
              <div className="w-40 h-40 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
                {preview ? <img src={preview} alt="Aperçu" className="w-full h-full object-cover" /> : <FiCamera className="w-12 h-12 text-slate-300" />}
              </div>
              <label className="absolute bottom-1 right-1 w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center cursor-pointer border-4 border-white shadow-lg">
                <FiCamera className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>
            <p className="text-slate-500 text-sm">Une photo profil attire plus de regards !</p>
            <div className="flex gap-3">
              <button onClick={prevStep} className="flex-1 py-4 border-2 border-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-50"><FiArrowLeft /> Retour</button>
              <button onClick={nextStep} disabled={!preview} className="flex-1 py-4 bg-pink-500 disabled:bg-slate-300 text-white disabled:text-slate-500 rounded-xl font-bold shadow-lg disabled:shadow-none disabled:cursor-not-allowed">{preview ? "Suivant" : "Veuillez ajouter une photo"} <FiArrowRight /></button>
            </div>
          </div>
        )}

        {/* Etape 4 */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 text-sm">Utilisateur</span>
                <span className="font-bold">@{form.username}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 text-sm">Nom complet</span>
                <span className="font-bold">{form.firstName} {form.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Ville</span>
                <span className="font-bold">{form.city}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={prevStep} className="flex-1 py-4 border-2 border-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-50"><FiArrowLeft /> Retour</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-[2] py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200 transition-all active:scale-95 disabled:opacity-50">
                {loading ? "Création..." : "Confirmer l'inscription"}
              </button>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-slate-400 text-sm">Déjà un compte ? <Link to="/login" className="text-pink-600 font-bold hover:underline">Se connecter</Link></p>
      </div>
    </div>
  );
}
