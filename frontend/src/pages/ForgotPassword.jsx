import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiMail, FiLock, FiCheck, FiShield, FiAlertCircle } from 'react-icons/fi';
import client from '../api/client';
import logo from '../assets/logo.png';

const GENERIC_SENT = 'Si cet email existe, un code à 6 chiffres a été envoyé.';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // email | code | password | done
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const codeInputs = useRef([]);

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1);
    setVerificationCode(newCode);

    if (value && index < 5) {
      codeInputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputs.current[index - 1].focus();
    }
  };

  const sendCode = async (e) => {
    if (e) e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return toast.error('Veuillez entrer votre email');

    setLoading(true);
    try {
      await client.post('/auth/forgot-password', { email: normalizedEmail });
      setEmail(normalizedEmail);
      setStep('code');
      toast.success(GENERIC_SENT);
    } catch {
      // Pour des raisons de sécurité, on passe à l'étape suivante même en cas d'erreur
      setStep('code');
      toast.success(GENERIC_SENT);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    if (e) e.preventDefault();
    const code = verificationCode.join('');
    if (code.length !== 6) return toast.error('Le code doit contenir 6 chiffres.');

    setLoading(true);
    try {
      const { data } = await client.post('/auth/verify-reset-code', { email, code });
      setResetToken(data.resetToken);
      setStep('password');
      toast.success('Code valide. Créez votre nouveau mot de passe.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  const saveNewPassword = async (e) => {
    if (e) e.preventDefault();

    if (!resetToken) {
      toast.error('Session expirée. Recommencez.');
      setStep('email');
      return;
    }

    if (password.length < 6) return toast.error('Mot de passe trop court (min 6)');
    if (password !== confirmPassword) return toast.error('Les mots de passe ne correspondent pas');

    setLoading(true);
    try {
      await client.post('/auth/reset-password', { token: resetToken, password });
      setStep('done');
      toast.success('Mot de passe réinitialisé !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la modification');
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
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg mx-auto z-10 p-4"
      >
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden text-center">
          
          <button 
            onClick={() => step === 'email' ? navigate('/login') : setStep('email')} 
            className="absolute top-8 left-8 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white"
          >
            <FiArrowLeft className="text-xl" />
          </button>

          <img src={logo} alt="HAITZ" className="h-20 object-contain mx-auto mb-10 mt-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />

          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            {step === 'email' && "Récupération"}
            {step === 'code' && "Vérification"}
            {step === 'password' && "Nouveau pass"}
            {step === 'done' && "Succès !"}
          </h1>
          <p className="text-slate-400 text-sm mb-12">
            {step === 'email' && "Entrez votre email pour recevoir un code de reset."}
            {step === 'code' && `Entrez le code envoyé à ${email}`}
            {step === 'password' && "Définissez un mot de passe sécurisé."}
            {step === 'done' && "Votre mot de passe a été mis à jour avec succès."}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {step === 'email' && (
                <div className="space-y-6">
                  <div className="group relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                    <input 
                      type="email" 
                      placeholder="Adresse e-mail" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all placeholder:text-slate-600" 
                    />
                  </div>
                  <button 
                    onClick={sendCode} 
                    disabled={loading || !email}
                    className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:scale-[1.02] transition-all disabled:opacity-30"
                  >
                    {loading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Envoyer le code"}
                  </button>
                </div>
              )}

              {step === 'code' && (
                <div className="space-y-8">
                  <div className="flex justify-between gap-2 md:gap-4">
                    {verificationCode.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => codeInputs.current[idx] = el}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleCodeChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-full aspect-square text-center text-3xl font-black bg-white/5 border-2 border-white/10 text-white rounded-2xl focus:border-pink-500 focus:bg-pink-500/10 outline-none transition-all"
                      />
                    ))}
                  </div>

                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={verifyCode} 
                      disabled={loading || verificationCode.some(d => !d)}
                      className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(244,63,94,0.3)] disabled:opacity-30 transition-all"
                    >
                      {loading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Valider le code"}
                    </button>
                    <button onClick={() => setStep('email')} className="text-pink-500 text-xs font-bold uppercase tracking-widest hover:text-pink-400 transition-colors">Changer d'adresse email</button>
                  </div>
                </div>
              )}

              {step === 'password' && (
                <div className="space-y-6">
                  <div className="group relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                    <input 
                      type="password" 
                      placeholder="Nouveau mot de passe" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all placeholder:text-slate-600" 
                    />
                  </div>
                  <div className="group relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                    <input 
                      type="password" 
                      placeholder="Confirmer mot de passe" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-4 rounded-2xl focus:border-pink-500 outline-none transition-all placeholder:text-slate-600" 
                    />
                  </div>
                  <button 
                    onClick={saveNewPassword} 
                    disabled={loading || !password}
                    className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:scale-[1.02] transition-all disabled:opacity-30"
                  >
                    {loading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Enregistrer"}
                  </button>
                </div>
              )}

              {step === 'done' && (
                <div className="space-y-8">
                  <div className="w-20 h-20 bg-gradient-to-tr from-pink-500/20 to-rose-500/20 rounded-full flex items-center justify-center mx-auto relative">
                    <div className="absolute inset-0 bg-pink-500/10 blur-xl rounded-full" />
                    <FiCheck className="w-10 h-10 text-pink-500 relative z-10" />
                  </div>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="w-full py-5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white rounded-2xl font-black text-xl shadow-[0_15px_40px_rgba(244,63,94,0.4)] transition-all active:scale-[0.97]"
                  >
                    ALLER À LA CONNEXION
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-10 text-center text-slate-500 text-sm font-medium">
          Besoin d'aide ? <Link to="/contact" className="text-pink-500 font-bold hover:text-pink-400 transition-colors">Contacter le support</Link>
        </p>
      </motion.div>
    </div>
  );
}
