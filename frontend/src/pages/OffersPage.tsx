import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, Clock, MapPin, X, MessageSquare, Trash2 } from 'lucide-react';
import api from '../api/client';
import { Offer } from '../types';
import { useAuth } from '../context/AuthContext';

export const OffersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Création d'offre
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('23:00');
  const [hourlyRate, setHourlyRate] = useState<number>(13);
  const [city, setCity] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const url = cityFilter.trim()
        ? `/offers?city=${encodeURIComponent(cityFilter.trim())}`
        : '/offers';
      const res = await api.get<Offer[]>(url);
      setOffers(res.data);
    } catch (err) {
      console.error('Erreur chargement offres', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      await api.post('/offers', {
        title,
        description,
        date,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        hourly_rate: Number(hourlyRate),
        city,
      });
      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setDate('');
      fetchOffers();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || "Erreur lors de la publication de l'offre.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleApply = async (offer: Offer) => {
    if (!user) {
      navigate('/auth?tab=login');
      return;
    }
    // Démarrer une conversation avec le parent
    try {
      const res = await api.post('/conversations', {
        recipient_id: offer.parent_id,
      });
      navigate(`/messages?conv=${res.data.id}`);
    } catch (err) {
      console.error('Erreur ouverture discussion offre', err);
    }
  };

  const handleDeleteOffer = async (offerId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette offre ?')) return;
    try {
      await api.delete(`/offers/${offerId}`);
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
    } catch (err) {
      console.error('Erreur suppression offre', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Annonces de garde disponibles
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Consultez les offres publiées par les parents ou déposez votre annonce
          </p>
        </div>

        {user?.role === 'PARENT' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm shrink-0"
          >
            <Plus size={18} />
            <span>Publier une offre</span>
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Filtrer par ville..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOffers()}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        </div>
        <button
          onClick={fetchOffers}
          className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition"
        >
          Filtrer
        </button>
      </div>

      {/* Offers list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 h-36 animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : offers.length > 0 ? (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{offer.title}</h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                    Ouverte
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin size={15} className="text-slate-400" />
                    {offer.city}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={15} className="text-slate-400" />
                    {new Date(offer.date).toLocaleDateString('fr-FR')}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={15} className="text-slate-400" />
                    {offer.start_time.slice(0, 5)} à {offer.end_time.slice(0, 5)}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-blue-600">
                    💰 {offer.hourly_rate} €/h
                  </span>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mt-2">
                  "{offer.description}"
                </p>

                <div className="text-xs text-slate-400">
                  Publié par {offer.parent?.profile?.first_name || 'Un parent'}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {user && (user.id === offer.parent_id || user.role === 'ADMIN') && (
                  <button
                    onClick={() => handleDeleteOffer(offer.id)}
                    title="Supprimer mon offre"
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                {user?.id !== offer.parent_id && (
                  <button
                    onClick={() => handleApply(offer)}
                    className="w-full md:w-auto py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-xs"
                  >
                    <MessageSquare size={16} />
                    <span>Postuler / Contacter</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <p className="text-slate-500 text-base mb-2">Aucune annonce de babysitting trouvée pour cette recherche.</p>
        </div>
      )}

      {/* Modal Création Offre */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Publier une annonce</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Titre de l'annonce</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Recherche babysitter pour soirée samedi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description détaillée</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Besoin d'une personne de confiance pour 2 enfants (3 et 6 ans). Jeux calmes et coucher à 21h."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ville</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Orléans"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Début</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fin</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tarif (€/h)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-sm shadow-sm disabled:opacity-50 mt-4"
              >
                {modalLoading ? 'Publication...' : 'Publier mon annonce'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

