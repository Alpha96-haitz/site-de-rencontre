/**
 * Contexte d'authentification global
 */
import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  onAuthStateChanged
} from 'firebase/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setIsEmailVerified(fbUser.emailVerified);
      } else {
        setIsEmailVerified(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await client.get('/auth/me');
      setUser(data);
    } catch (err) {
      const status = err?.response?.status;

      // Ne deconnecter automatiquement que si le token est vraiment invalide
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      if (auth.currentUser) {
        setIsEmailVerified(auth.currentUser.emailVerified);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);

    // Synchronisation Firebase
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      setIsEmailVerified(userCred.user.emailVerified);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        // Tentative de création auto si l'utilisateur existe backend mais pas Firebase
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          await sendEmailVerification(userCred.user);
          setIsEmailVerified(false);
        } catch (fbCreateErr) {
          console.error("Erreur création Firebase auto:", fbCreateErr);
        }
      } else {
        console.error("Erreur login Firebase:", err);
      }
    }
    return data;
  };

  const signup = async (formData) => {
    const { data } = await client.post('/auth/signup', formData);
    localStorage.setItem('token', data.token);
    setUser(data.user);

    // Initialisation Firebase
    try {
      const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await sendEmailVerification(userCred.user);
      setIsEmailVerified(false);
    } catch (err) {
      console.error("Erreur initialisation Firebase:", err);
    }
    return data;
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await client.post('/auth/google', { credential });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } catch {
      // Ignorer les erreurs (ex: token expiré)
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const refreshVerificationStatus = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setIsEmailVerified(auth.currentUser.emailVerified);
      return auth.currentUser.emailVerified;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isEmailVerified, 
      login, 
      signup, 
      loginWithGoogle, 
      logout, 
      refreshUser: fetchUser,
      refreshVerificationStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};
