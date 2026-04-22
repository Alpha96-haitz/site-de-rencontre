import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { FiArrowRight, FiArrowLeft, FiCamera, FiCheck, FiUser, FiMail, FiLock, FiCalendar, FiMapPin, FiShield } from 'react-icons/fi';
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
  
  const { signup, refreshUser } = useAuth();
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
      
      const res = await signup(signupData);
      
      if (photo) {
        const formData = new FormData();
        formData.append('photo', photo);
        try {
          await client.post('/users/photos', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000
          });
          await refreshUser();
        } catch (photoErr) {
          console.error("Erreur upload photo:", photoErr);
          toast.error(photoErr?.response?.data?.message || "Photo non importee, mais le compte est cree.");
        }
      } else {
        await refreshUser();
      }
      
      toast.success('Bienvenue sur HAITZ-RENCONTRE !');
      // On laisse le middleware/AuthContext gérer la redirection ou on le fait ici
      if (res.needsVerification) {
        navigate('/verify-email-required');
      } else {
        navigate('/home');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    enter: { x: 20, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a] font-sans selection:bg-pink-500 selection:text-white">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg mx-auto z-10 p-4"
      >
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <button onClick={() => step > 1 ? prevStep() : navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <FiArrowLeft className="text-white text-xl" />
            </button>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(s => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-gradient-to-r from-pink-500 to-rose-500' : 'w-2 bg-white/10'}`}
                />
              ))}
            </div>
          </div>

          <div className="text-center mb-12">
            <img src={logo} alt="HAITZ" className="h-20 object-contain mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              {step === 1 && "Commencez l'aventure"}
              {step === 2 && "Qui êtes-vous ?"}
              {step === 3 && "Montrez-vous"}
              {step === 4 && "Prêt à partir ?"}
            </h1>
            <p className="text-slate-400 text-sm">
              {step === 1 && "Créez votre compte pour rencontrer des gens."}
              {step === 2 && "Dites-nous en plus sur vous."}
              {step === 3 && "Une photo rend votre profil 7x plus attirant."}
              {step === 4 && "Vérifiez vos informations avant de confirmer."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Etape 1 */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="group relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                    <input name="username" placeholder="Nom d'utilisateur" value={form.username} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all placeholder:text-slate-600" />
                  </div>
                  <div className="group relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                    <input name="email" type="email" placeholder="Adresse e-mail" value={form.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all placeholder:text-slate-600" />
                  </div>
                  <div className="group relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                    <input name="password" type="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all placeholder:text-slate-600" />
                  </div>
                  <button 
                    onClick={nextStep} 
                    className="w-full py-4 mt-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl font-bold text-lg shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Continuer <FiArrowRight />
                  </button>
                </div>
              )}

              {/* Etape 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input name="firstName" placeholder="Prénom" value={form.firstName} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all placeholder:text-slate-600" />
                    <input name="lastName" placeholder="Nom" value={form.lastName} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all placeholder:text-slate-600" />
                  </div>
                  <div className="group relative">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                    <input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all font-sans" />
                  </div>
                  <div className="group relative">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                    <input name="city" placeholder="Ville" value={form.city} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all placeholder:text-slate-600" />
                  </div>
                  <div className="relative">
                     <select name="gender" value={form.gender} onChange={handleChange} className="w-full bg-white/5 border border-white/10 text-slate-300 px-5 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all appearance-none cursor-pointer">
                        <option value="" className="bg-slate-900">Genre</option>
                        <option value="male" className="bg-slate-900">Homme</option>
                        <option value="female" className="bg-slate-900">Femme</option>
                        <option value="other" className="bg-slate-900">Autre</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                  </div>
                  <button onClick={nextStep} className="w-full py-4 mt-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl font-bold text-lg shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">Continuer <FiArrowRight /></button>
                </div>
              )}

              {/* Etape 3 */}
              {step === 3 && (
                <div className="space-y-8 text-center pt-4">
                  <div className="relative group mx-auto w-48 h-48">
                    <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-rose-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative w-48 h-48 rounded-full border-2 border-white/10 bg-white/5 flex items-center justify-center overflow-hidden ring-4 ring-white/5 ring-offset-4 ring-offset-black transition-all">
                      {preview ? 
                        <img src={preview} alt="Aperçu" className="w-full h-full object-cover scale-105 hover:scale-110 transition-transform duration-700" /> : 
                        <FiCamera className="w-16 h-16 text-slate-700 group-hover:text-pink-500 transition-colors duration-500" />
                      }
                      <label className="absolute inset-0 cursor-pointer">
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                      </label>
                    </div>
                    {preview && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -bottom-2 -right-2 bg-pink-500 p-3 rounded-full border-4 border-black text-white shadow-xl">
                        <FiCheck className="text-xl" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-slate-400 max-w-[250px] mx-auto">Téléchargez une photo de vous pour rendre votre profil plus attirant !</p>
                  <button onClick={nextStep} disabled={!preview} className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl font-bold shadow-[0_10px_30px_rgba(244,63,94,0.3)] disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2">Presque fini <FiArrowRight /></button>
                </div>
              )}

              {/* Etape 4 */}
              {step === 4 && (
                <div className="space-y-8">
                  <div className="bg-white/5 rounded-3xl p-6 border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><FiShield className="text-6xl text-white" /></div>
                    <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Pseudo</span>
                        <span className="text-white font-black text-right">@{form.username}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Nom complet</span>
                        <span className="text-white font-black text-right">{form.firstName} {form.lastName}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Ville</span>
                        <span className="text-white font-black text-right">{form.city}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={handleSubmit} 
                      disabled={loading} 
                      className="w-full py-5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white rounded-2xl font-black text-xl shadow-[0_15px_40px_rgba(244,63,94,0.4)] hover:shadow-[0_20px_50px_rgba(244,63,94,0.5)] transition-all active:scale-[0.97] flex items-center justify-center gap-3"
                    >
                      {loading ? <span className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <>C'EST PARTI ! <FiCheck /></>}
                    </button>
                    <button onClick={prevStep} className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Modifier quelque chose ?</button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <p className="mt-10 text-center text-slate-500 text-sm font-medium">
          Déjà membre ? <Link to="/login" className="text-pink-500 font-bold hover:text-pink-400 transition-colors decoration-2 underline-offset-4 hover:underline">Se connecter</Link>
        </p>
      </motion.div>
    </div>
  );
}
