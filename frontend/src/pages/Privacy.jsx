import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-pink-600 mb-6">
          ← Retour à l'accueil
        </Link>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-4xl font-black text-slate-900 mb-6">Politique de confidentialité</h1>
          <p className="text-slate-700 leading-relaxed mb-6">
            Votre vie privée est importante. Nous nous engageons à protéger vos données personnelles et à les utiliser de
            manière transparente et sécurisée.
          </p>
          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">1. Données collectées</h2>
              <p className="text-slate-600 leading-relaxed">
                Nous collectons les informations nécessaires à votre inscription, à la gestion de votre profil et à l'amélioration
                de l'expérience utilisateur : nom, email, photo, âge, localisation et préférences.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">2. Utilisation des données</h2>
              <p className="text-slate-600 leading-relaxed">
                Vos données sont utilisées pour afficher des profils compatibles, envoyer des notifications et assurer le bon
                fonctionnement du service. Elles ne sont pas revendues à des tiers.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">3. Sécurité</h2>
              <p className="text-slate-600 leading-relaxed">
                Nous protégeons vos données avec des mesures techniques et organisationnelles adaptées. Les informations sensibles
                sont stockées de manière sécurisée.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">4. Vos droits</h2>
              <p className="text-slate-600 leading-relaxed">
                Vous pouvez accéder, corriger ou supprimer vos données à tout moment depuis votre espace personnel. Contactez-nous
                si vous souhaitez exercer vos droits.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
