import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-pink-600 mb-6">
          ← Retour à l'accueil
        </Link>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-4xl font-black text-slate-900 mb-6">Conditions d'utilisation</h1>
          <p className="text-slate-700 leading-relaxed mb-6">
            Bienvenue sur HAITZ. En utilisant notre plateforme, vous acceptez les présentes conditions d'utilisation.
            Ces conditions définissent vos droits et obligations vis-à-vis de notre service, de nos utilisateurs et de
            notre communauté.
          </p>
          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">1. Inscription</h2>
              <p className="text-slate-600 leading-relaxed">
                Vous devez avoir au moins 18 ans pour créer un compte. Les informations que vous fournissez doivent être
                véridiques et à jour. Toute fausse déclaration peut entraîner la suspension de votre compte.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">2. Contenu utilisateur</h2>
              <p className="text-slate-600 leading-relaxed">
                Vous restez responsable du contenu que vous publiez. Aucun contenu haineux, discriminatoire ou illégal
                n'est autorisé. Nous nous réservons le droit de supprimer tout contenu non conforme.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">3. Comportement</h2>
              <p className="text-slate-600 leading-relaxed">
                Le respect et la bienveillance sont obligatoires. Le harcèlement, le spamming et les comportements abusifs
                peuvent conduire à un bannissement immédiat.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">4. Propriété intellectuelle</h2>
              <p className="text-slate-600 leading-relaxed">
                Tous les droits sur la marque HAITZ, l'interface et le contenu propriétaire sont réservés. Vous pouvez
                utiliser le service dans le cadre de l'application des présentes conditions.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
