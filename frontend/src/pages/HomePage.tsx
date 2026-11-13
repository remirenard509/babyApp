import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { Profile } from '../types';
import { BabysitterCard } from '../components/BabysitterCard';

export const HomePage: React.FC = () => {
  const [city, setCity] = useState('');
  const [featuredBabysitters, setFeaturedBabysitters] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get<Profile[]>('/profiles/search?verified_only=true&limit=3');
        setFeaturedBabysitters(res.data);
      } catch (err) {
        console.error('Erreur chargement profils à la une', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      navigate(`/search?city=${encodeURIComponent(city.trim())}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-blue-50/70 to-slate-50 py-16 md:py-24 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-6">
            <ShieldCheck size={14} /> La plateforme de confiance pour vos enfants
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Trouvez un babysitter de confiance <br className="hidden sm:inline" />
            <span className="text-blue-600">près de chez vous</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Des profils vérifiés, diplômés (BAFA, PSC1) ou recommandés par d'autres parents pour des gardes occasionnelles ou régulières en toute sérénité.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto bg-white p-2 rounded-2xl shadow-lg border border-slate-200 flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 flex items-center px-3">
              <Search size={20} className="text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Entrez votre ville ou code postal..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full py-2.5 text-sm sm:text-base outline-none text-slate-800 placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition duration-150 flex items-center justify-center gap-2"
            >
              <span>Rechercher</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Comment ça marche ?</h2>
          <p className="text-slate-500 text-sm mt-2">La garde de vos enfants organisée en 3 étapes simples</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center shadow-xs">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              1
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Recherchez</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Filtrez selon votre ville, le tarif horaire souhaité et les qualifications requises pour trouver la perle rare.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center shadow-xs">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              2
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Réservez</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Consultez les disponibilités, échangez via la messagerie intégrée et formulez votre demande de garde en un clic.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center shadow-xs">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              3
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Profitez</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Vos enfants sont entre de bonnes mains ! Notez et partagez votre expérience une fois la prestation terminée.
            </p>
          </div>
        </div>
      </section>

      {/* BABYSITTERS À LA UNE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Babysitters à la une</h2>
            <p className="text-slate-500 text-sm mt-1">Des profils vérifiés et recommandés par les parents de votre région</p>
          </div>
          <Link
            to="/search"
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 group"
          >
            <span>Voir tous les babysitters</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 h-64 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBabysitters.length > 0 ? (
              featuredBabysitters.map((profile) => (
                <BabysitterCard key={profile.user_id} profile={profile} />
              ))
            ) : (
              <p className="text-slate-500 col-span-3 text-center py-8">Aucun profil vérifié disponible pour le moment.</p>
            )}
          </div>
        )}
      </section>

      {/* CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">Vous gardez des enfants ?</h3>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Rejoignez notre communauté de babysitters certifiés. Définissez vos propres tarifs, vos disponibilités et trouvez des familles de confiance.
            </p>
          </div>
          <Link
            to="/auth?tab=register&role=BABYSITTER"
            className="py-3 px-8 bg-white hover:bg-slate-100 text-blue-600 font-bold rounded-xl shadow-md transition shrink-0"
          >
            Devenir Babysitter
          </Link>
        </div>
      </section>
    </div>
  );
};

