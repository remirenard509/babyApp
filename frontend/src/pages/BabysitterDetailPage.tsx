import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Award,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import api from '../api/client';
import { Profile, Review } from '../types';
import { StarRating } from '../components/StarRating';
import { useAuth } from '../context/AuthContext';

export const BabysitterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire de réservation intégré
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('22:30');
  const [childrenCount, setChildrenCount] = useState(2);
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [profRes, revRes] = await Promise.all([
          api.get<Profile>(`/profiles/${id}`),
          api.get<Review[]>(`/reviews/babysitter/${id}`),
        ]);
        setProfile(profRes.data);
        setReviews(revRes.data);
      } catch (err) {
        console.error('Erreur chargement profil babysitter', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  const handleContactBabysitter = async () => {
    if (!user) {
      navigate('/auth?tab=login');
      return;
    }
    try {
      const res = await api.post('/conversations', {
        recipient_id: Number(id),
      });
      navigate(`/messages?conv=${res.data.id}`);
    } catch (err) {
      console.error('Erreur ouverture conversation', err);
    }
  };

  const calculateTotal = () => {
    if (!profile || !startTime || !endTime) return 0;
    const rate = profile.hourly_rate || 12;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let hours = endH + endM / 60 - (startH + startM / 60);
    if (hours <= 0) hours += 24;
    return Math.round(hours * rate * 100) / 100;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth?tab=login');
      return;
    }
    if (user.role !== 'PARENT') {
      setBookingError('Seuls les comptes Parents peuvent réserver un babysitter.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      await api.post('/bookings', {
        babysitter_id: Number(id),
        date,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        children_count: Number(childrenCount),
        notes,
      });
      setBookingSuccess(true);
    } catch (err: any) {
      setBookingError(err.response?.data?.detail || 'Erreur lors de la réservation.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 animate-pulse h-96 border border-slate-100" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600 text-lg mb-4">Profil introuvable.</p>
        <Link to="/search" className="text-blue-600 font-bold hover:underline">
          Retour à la recherche
        </Link>
      </div>
    );
  }

  const avatar =
    profile.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile.first_name + ' ' + profile.last_name
    )}&background=2563EB&color=fff&size=128`;

  const totalPrice = calculateTotal();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Bouton retour */}
      <Link
        to="/search"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft size={16} />
        <span>Retour aux résultats</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Gauche : Détails Profil & Avis */}
        <div className="lg:col-span-2 space-y-8">
          {/* Fiche Profil */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100">
              <div className="relative">
                <img
                  src={avatar}
                  alt={profile.first_name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-slate-50 shadow-sm"
                />
                {profile.is_verified && (
                  <div
                    title="Profil Vérifié"
                    className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-sm"
                  >
                    <ShieldCheck size={20} />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  <span className="text-2xl font-bold text-blue-600">
                    {profile.hourly_rate ? `${profile.hourly_rate} €/h` : '12 €/h'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-slate-600">
                  {profile.calculated_age && (
                    <span className="font-medium">{profile.calculated_age} ans</span>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={15} className="text-slate-400" />
                    {profile.city} ({profile.postal_code})
                  </span>
                  {profile.is_verified && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                        <ShieldCheck size={14} /> Profil Vérifié
                      </span>
                    </>
                  )}
                </div>

                {/* Note et avis */}
                <div className="flex items-center justify-center sm:justify-start space-x-2 mt-4">
                  <StarRating rating={profile.average_rating || 5} size={18} />
                  <span className="font-bold text-slate-800 text-sm">
                    {profile.average_rating ? profile.average_rating.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-slate-400 text-sm">
                    ({profile.reviews_count || reviews.length} avis)
                  </span>
                </div>
              </div>
            </div>

            {/* Bouton Contacter */}
            <div className="mt-6 flex gap-4">
              <button
                type="button"
                onClick={handleContactBabysitter}
                className="flex-1 py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
              >
                <MessageSquare size={18} />
                <span>Contacter {profile.first_name}</span>
              </button>
            </div>

            {/* Bio */}
            <div className="mt-8">
              <h2 className="text-lg font-bold text-slate-900 mb-3">À propos</h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {profile.bio || "Aucune description fournie pour le moment."}
              </p>
            </div>

            {/* Expérience */}
            {profile.experience_years !== undefined && profile.experience_years !== null && (
              <div className="mt-6 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Award size={24} className="text-blue-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Expérience certifiée</h4>
                  <p className="text-xs text-slate-500">
                    {profile.experience_years} année{profile.experience_years > 1 ? 's' : ''} d'expérience dans la garde d'enfants
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section Avis */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span>Avis des parents</span>
              <span className="text-sm font-normal text-slate-400">
                ({reviews.length})
              </span>
            </h2>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800 text-sm">
                          {rev.parent?.profile?.first_name || 'Parent'}
                        </span>
                        <span className="text-xs text-slate-400">
                          • {new Date(rev.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <StarRating rating={rev.rating} size={14} />
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-6">
                Aucun avis pour le moment. Soyez le premier parent à laisser une évaluation !
              </p>
            )}
          </div>
        </div>

        {/* Colonne Droite : Formulaire de réservation intégré */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md sticky top-24">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Réserver ce babysitter</h3>
            <p className="text-xs text-slate-500 mb-6">
              Complétez le formulaire ci-dessous pour planifier votre garde.
            </p>

            {bookingSuccess ? (
              <div className="p-6 text-center flex flex-col items-center bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle2 size={48} className="text-emerald-500 mb-3" />
                <h4 className="text-base font-bold text-emerald-800 mb-1">Demande envoyée !</h4>
                <p className="text-xs text-emerald-700">
                  {profile.first_name} a été notifié(e). Vous pouvez suivre l'avancement dans votre espace personnel.
                </p>
                <Link
                  to="/dashboard"
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl"
                >
                  Voir mes réservations
                </Link>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {bookingError && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                    {bookingError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Date de la garde
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Début
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Fin
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nombre d'enfants
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Notes / Remarques
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Prévoir un doudou pour la plus petite..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <span className="text-xs text-slate-600 font-medium">Prix estimé :</span>
                  <span className="text-lg font-bold text-orange-500">{totalPrice} €</span>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-sm text-sm disabled:opacity-50"
                >
                  {bookingLoading
                    ? 'Traitement...'
                    : `DEMANDER LA RÉSERVATION (${totalPrice} €)`}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

