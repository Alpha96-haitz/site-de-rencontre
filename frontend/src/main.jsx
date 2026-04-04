import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const AppWithProviders = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppWithProviders />
      </GoogleOAuthProvider>
    ) : (
      <AppWithProviders />
    )}
  </React.StrictMode>
);
