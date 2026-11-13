import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Save,
  Check,
  Trash2,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Booking, Offer } from '../types';
import { StarRating } from '../components/StarRating';

export const DashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'bookings' | 'profile' | 'offers'>('bookings');

  // Réservations
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Offres (pour le Parent)
  const [myOffers, setMyOffers] = useState<Offer[]>([]);

  // Profil Form (pour le Babysitter)
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [experienceYears, setExperienceYears] = useState<string>('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Upload Justificatif
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docSuccess, setDocSuccess] = useState(false);

  // Avis modal & feedback
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth?tab=login');
      return;
    }

    if (user.profile) {
      setBio(user.profile.bio || '');
      setHourlyRate(user.profile.hourly_rate ? user.profile.hourly_rate.toString() : '');
      setExperienceYears(user.profile.experience_years ? user.profile.experience_years.toString() : '');
    }

    fetchBookings();
    if (user.role === 'PARENT') {
      fetchMyOffers();
    }
  }, [user, navigate]);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await api.get<Booking[]>('/bookings');
      setBookings(res.data);
    } catch (err) {
      console.error('Erreur réservations', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchMyOffers = async () => {
    try {
      const res = await api.get<Offer[]>('/offers/my');
      setMyOffers(res.data);
    } catch (err) {
      console.error('Erreur chargement mes offres', err);
    }
  };

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      fetchBookings();
    } catch (err) {
      console.error('Erreur mise à jour statut réservation', err);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await api.put('/profiles/me', {
        bio,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        experience_years: experienceYears ? parseInt(experienceYears) : null,
      });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde profil', err);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append('file', docFile);

    try {
      await api.post('/profiles/me/upload-doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      setDocSuccess(true);
      setDocFile(null);
      setTimeout(() => setDocSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur upload document', err);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBookingId) return;

    setSubmittingReview(true);
    setReviewError(null);
    try {
      await api.post('/reviews', {
        booking_id: reviewBookingId,
        rating,
        comment,
      });
      setReviewBookingId(null);
      setComment('');
      fetchBookings();
    } catch (err: any) {
      console.error('Erreur envoi avis', err);
      setReviewError(err.response?.data?.detail || "Erreur lors de l'enregistrement de l'avis.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteMyOffer = async (offerId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette offre ?')) return;
    try {
      await api.delete(`/offers/${offerId}`);
      setMyOffers((prev) => prev.filter((o) => o.id !== offerId));
    } catch (err) {
      console.error('Erreur suppression offre', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Mon Espace Personnel
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Bienvenue, {user?.profile?.first_name} {user?.profile?.last_name} ({user?.role})
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
              activeTab === 'bookings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Réservations
          </button>
          {user?.role === 'BABYSITTER' && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                activeTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mon Profil & Justificatifs
            </button>
          )}
          {user?.role === 'PARENT' && (
            <button
              onClick={() => setActiveTab('offers')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                activeTab === 'offers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mes Offres
            </button>
          )}
        </div>
      </div>

      {/* Onglet 1 : Réservations */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            {user?.role === 'PARENT' ? 'Mes demandes de garde' : 'Demandes reçues'}
          </h2>

          {loadingBookings ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : bookings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {bookings.map((booking) => {
                const partner = user?.role === 'PARENT' ? booking.babysitter?.profile : booking.parent?.profile;
                return (
                  <div
                    key={booking.id}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {user?.role === 'PARENT' ? `Garde avec ${partner?.first_name}` : `Garde pour ${partner?.first_name}`}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            booking.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : booking.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : booking.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {booking.status === 'PENDING' && 'EN ATTENTE'}
                          {booking.status === 'ACCEPTED' && 'ACCEPTÉE'}
                          {booking.status === 'COMPLETED' && 'TERMINÉE'}
                          {booking.status === 'REJECTED' && 'REFUSÉE'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(booking.date).toLocaleDateString('fr-FR')}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-slate-700">
                          {booking.total_price} € ({booking.children_count} enfant{booking.children_count > 1 ? 's' : ''})
                        </span>
                      </div>

                      {booking.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-2">
                          Note : {booking.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions de statut */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      {user?.role === 'BABYSITTER' && booking.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(booking.id, 'ACCEPTED')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => handleStatusChange(booking.id, 'REJECTED')}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl transition"
                          >
                            Refuser
                          </button>
                        </>
                      )}

                      {user?.role === 'PARENT' && booking.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleStatusChange(booking.id, 'COMPLETED')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                        >
                          Marquer comme terminée
                        </button>
                      )}

                      {user?.role === 'PARENT' && booking.status === 'COMPLETED' && (
                        booking.review ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold border border-amber-200">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            <span>Avis laissé ({booking.review.rating}/5)</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReviewBookingId(booking.id);
                              setReviewError(null);
                            }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1"
                          >
                            <Star size={14} />
                            <span>Laisser un avis</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-100">
              Aucune réservation trouvée pour le moment.
            </div>
          )}
        </div>
      )}

      {/* Onglet 2 : Profil Babysitter & Pièce d'identité */}
      {activeTab === 'profile' && user?.role === 'BABYSITTER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Formulaire Bio et Tarif */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Édition du profil</h2>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                <Check size={16} /> Profil mis à jour avec succès !
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Bio / Présentation
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Présentez vos expériences, vos diplômes et vos qualités..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tarif horaire (€/h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="Ex: 12"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Années d'expérience
                  </label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="Ex: 3"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2"
              >
                <Save size={16} />
                <span>{profileSaving ? 'Sauvegarde...' : 'Enregistrer les modifications'}</span>
              </button>
            </form>
          </div>

          {/* Justificatifs / Pièce d'identité */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Justificatifs & Badge Vérifié</h2>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-600">Statut de vérification :</span>
              <div>
                {user.profile?.verification_status === 'APPROVED' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle size={14} /> Profil Vérifié & Approuvé
                  </span>
                )}
                {user.profile?.verification_status === 'PENDING' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <AlertCircle size={14} /> Document en cours de validation
                  </span>
                )}
                {user.profile?.verification_status === 'REJECTED' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                    <XCircle size={14} /> Justificatif refusé (veuillez en soumettre un nouveau)
                  </span>
                )}
                {user.profile?.verification_status === 'NONE' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                    Aucun document soumis
                  </span>
                )}
              </div>
            </div>

            {docSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                <Check size={16} /> Justificatif téléversé avec succès !
              </div>
            )}

            <form onSubmit={handleDocUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Téléverser une pièce d'identité ou un diplôme (PDF, PNG, JPG)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {user.profile?.verification_doc_url && (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <span>Document actuel :</span>
                  <a
                    href={user.profile.verification_doc_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-semibold underline"
                  >
                    Voir le fichier
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={uploadingDoc || !docFile}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload size={16} />
                <span>{uploadingDoc ? 'Envoi...' : 'Soumettre le document'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Onglet 3 : Offres du Parent */}
      {activeTab === 'offers' && user?.role === 'PARENT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Mes offres publiées</h2>
          </div>

          {myOffers.length > 0 ? (
            <div className="space-y-3">
              {myOffers.map((off) => (
                <div
                  key={off.id}
                  className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{off.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {off.city} • {new Date(off.date).toLocaleDateString('fr-FR')} • {off.hourly_rate} €/h
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        off.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {off.status === 'OPEN' ? 'Ouverte' : 'Clôturée'}
                    </span>
                    <button
                      onClick={() => handleDeleteMyOffer(off.id)}
                      title="Supprimer cette offre"
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-100">
              Vous n'avez pas encore publié d'offres de garde.
            </div>
          )}
        </div>
      )}

      {/* Modale Avis */}
      {reviewBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Laisser un avis</h3>
            <p className="text-xs text-slate-500">
              Notez la garde et partagez votre expérience avec la communauté.
            </p>

            {reviewError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Note globale</label>
                <StarRating
                  rating={rating}
                  size={24}
                  interactive={true}
                  onRatingChange={(newR) => setRating(newR)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Commentaire</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Super garde, ponctuelle et attentionnée..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReviewBookingId(null)}
                  className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
                >
                  {submittingReview ? 'Envoi...' : 'Publier mon avis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

