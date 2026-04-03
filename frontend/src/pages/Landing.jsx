import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiUsers, FiShare2, FiMail, FiPhone } from 'react-icons/fi';
import logo from '../assets/logo.png';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* HEADER */}
      <header className="fixed w-full flex justify-between items-center px-8 py-4 bg-white/90 backdrop-blur-md shadow-sm z-50">
        <Link to="/" className="flex items-center transform hover:scale-105 transition duration-300">
          <img src={logo} alt="HAITZ" className="h-10 md:h-12 object-contain" />
        </Link>
        <nav className="hidden md:flex space-x-8 text-gray-600 font-medium">
          <a href="#home" className="hover:text-red-500 transition">Accueil</a>
          <a href="#about" className="hover:text-red-500 transition">À propos</a>
          <a href="#how" className="hover:text-red-500 transition">Comment ça marche</a>
          <a href="#contact" className="hover:text-red-500 transition">Contact</a>
        </nav>
        <div>
          <Link to="/login" className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg shadow-red-500/30 transition transform hover:-translate-y-0.5">
            Connexion
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 flex items-center justify-center min-h-screen">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop" 
            alt="Couple romantique" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-xl animate-fade-in-up">
            Trouvez l'amour,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">célébrez la connexion</span>
          </h1>
          <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light drop-shadow-md">
            Rejoignez la plateforme de rencontre la plus moderne. Connectez-vous, partagez vos moments et découvrez des personnes qui vous correspondent vraiment.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup" className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-red-500/40 transform hover:scale-105 transition-all">
              Commencer maintenant
            </Link>
            <Link to="/login" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-full font-bold text-lg transition-all">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section id="how" className="py-24 bg-white relative -mt-10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Pourquoi choisir HAITZ ?</h2>
            <p className="text-xl text-gray-500">Une expérience sociale complète pensée pour de vraies rencontres.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<FiHeart className="w-8 h-8 text-red-500" />}
              title="Matching intelligent"
              desc="Notre algorithme vous propose des profils hautement compatibles avec vos intérêts et votre style de vie."
            />
            <FeatureCard 
              icon={<FiMessageCircle className="w-8 h-8 text-pink-500" />}
              title="Messagerie instantanée"
              desc="Discutez en temps réel avec vos matchs par messages sécurisés et rapides."
            />
            <FeatureCard 
              icon={<FiUsers className="w-8 h-8 text-purple-500" />}
              title="Abonnements"
              desc="Suivez les profils qui vous inspirent et restez informés de leurs actualités."
            />
            <FeatureCard 
              icon={<FiShare2 className="w-8 h-8 text-orange-500" />}
              title="Publication sociale"
              desc="Partagez vos photos, pensées et moments de vie dans un vrai fil d'actualité."
            />
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">Ils ont trouvé l'amour sur HAITZ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              name="Sophie & Julien"
              image="https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=2070"
              text="Grâce à HAITZ, j'ai non seulement trouvé mon âme sœur, mais j'ai adoré l'expérience sociale du site !"
            />
            <TestimonialCard 
              name="Marc & Elena"
              image="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=2070"
              text="Le fil d'actualité nous a permis de découvrir la personnalité de l'autre avant même notre premier rendez-vous."
            />
            <TestimonialCard 
              name="Thomas & Clara"
              image="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&q=80&w=2069"
              text="L'application est incroyablement fluide et les profils proposés étaient exactement ce que je recherchais."
            />
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 bg-white relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block px-4 py-2 bg-pink-50 text-pink-600 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-6">
             Contactez-nous
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Une question ?<br/><span className="text-pink-600">On vous répond.</span></h2>
          <p className="text-lg text-slate-500 mb-12 font-medium">Notre équipe est à votre disposition pour vous aider dans vos rencontres.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <a href="mailto:barrymamadoualpha124@gmail.com" className="group bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-500 p-8 rounded-[40px] border border-slate-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-6 group-hover:scale-110 transition-transform">
                   <FiMail className="w-8 h-8 text-pink-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Par Email</h3>
                <p className="text-pink-600 font-black tracking-tight underline underline-offset-4">barrymamadoualpha124@gmail.com</p>
             </a>

             <a href="tel:+224621956596" className="group bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-500 p-8 rounded-[40px] border border-slate-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-6 group-hover:scale-110 transition-transform">
                   <FiPhone className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Par Téléphone</h3>
                <p className="text-rose-600 font-black tracking-tight underline underline-offset-4">+224 621-95-6596</p>
             </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-8 md:mb-0 text-center md:text-left">
            <img src={logo} alt="HAITZ" className="h-16 md:h-16 object-contain brightness-0 invert mx-auto md:mx-0 mb-4" />
            <p>La plateforme sociale des rencontres modernes.</p>
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="hover:text-white transition">Conditions d'utilisation</a>
            <a href="#" className="hover:text-white transition">Confidentialité</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
        <div className="text-center mt-8 text-sm opacity-50">
          &copy; {new Date().getFullYear()} HAITZ. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 group border border-gray-100">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-6 group-hover:-translate-y-2 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function TestimonialCard({ name, image, text }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-center mb-4">
        <img src={image} alt={name} className="w-16 h-16 rounded-full object-cover mr-4 ring-4 ring-red-50" />
        <div>
          <h4 className="font-bold text-gray-900">{name}</h4>
          <div className="flex text-yellow-400 text-sm">
            {/* Stars */}
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </div>
        </div>
      </div>
      <p className="text-gray-600 italic">"{text}"</p>
    </div>
  );
}
