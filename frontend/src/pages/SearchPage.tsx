import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ShieldCheck, MapPin, DollarSign, Calendar } from 'lucide-react';
import api from '../api/client';
import { Profile } from '../types';
import { BabysitterCard } from '../components/BabysitterCard';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCity = searchParams.get('city') || '';

  const [city, setCity] = useState(initialCity);
  const [maxRate, setMaxRate] = useState<string>('');
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  const [babysitters, setBabysitters] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBabysitters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city.trim()) params.append('city', city.trim());
      if (maxRate) params.append('max_rate', maxRate);
      if (minAge) params.append('min_age', minAge);
      if (maxAge) params.append('max_age', maxAge);
      if (verifiedOnly) params.append('verified_only', 'true');

      const res = await api.get<Profile[]>(`/profiles/search?${params.toString()}`);
      setBabysitters(res.data);
    } catch (err) {
      console.error('Erreur chargement babysitters', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBabysitters();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBabysitters();
  };

  const handleResetFilters = () => {
    setCity('');
    setMaxRate('');
    setMinAge('');
    setMaxAge('');
    setVerifiedOnly(false);
    setTimeout(() => {
      api.get<Profile[]>('/profiles/search').then((res) => setBabysitters(res.data));
    }, 50);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search & Filter Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-lg">
          <Filter size={20} className="text-blue-600" />
          <span>Filtres de recherche</span>
        </div>

        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* City / CP */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ville / CP</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Orléans..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MapPin size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Max Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tarif max (€/h)</label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="50"
                placeholder="Ex: 15"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <DollarSign size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Min Age */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Âge minimum</label>
            <div className="relative">
              <input
                type="number"
                min="16"
                max="99"
                placeholder="Ex: 18"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Calendar size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Verified Checkbox */}
          <div className="flex items-end pb-2">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <ShieldCheck size={16} className="text-emerald-500" />
                Profils vérifiés
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <Search size={16} />
              <span>Filtrer</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition"
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">
          {babysitters.length} babysitter{babysitters.length > 1 ? 's' : ''} trouvé{babysitters.length > 1 ? 's' : ''}
        </h2>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 h-64 animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : babysitters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {babysitters.map((profile) => (
            <BabysitterCard key={profile.user_id} profile={profile} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <p className="text-slate-500 text-lg mb-4">Aucun babysitter ne correspond à vos critères de recherche.</p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition text-sm"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
};

