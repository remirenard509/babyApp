import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, X, Trash2, Eye } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { User, Review } from '../types';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'verifications' | 'moderation'>('verifications');

  // Vérifications
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loadingVerif, setLoadingVerif] = useState(true);

  // Modération
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loadingMod, setLoadingMod] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    if (activeTab === 'verifications') {
      fetchVerifications();
    } else {
      fetchModerationData();
    }
  }, [user, activeTab, navigate]);

  const fetchVerifications = async () => {
    setLoadingVerif(true);
    try {
      const res = await api.get<User[]>('/admin/verifications');
      setPendingUsers(res.data);
    } catch (err) {
      console.error('Erreur chargement vérifications', err);
    } finally {
      setLoadingVerif(false);
    }
  };

  const fetchModerationData = async () => {
    setLoadingMod(true);
    try {
      const [usersRes, revsRes] = await Promise.all([
        api.get<User[]>('/admin/users'),
        api.get<Review[]>('/admin/reviews'),
      ]);
      setAllUsers(usersRes.data);
      setAllReviews(revsRes.data);
    } catch (err) {
      console.error('Erreur chargement modération', err);
    } finally {
      setLoadingMod(false);
    }
  };

  const handleVerify = async (userId: number, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.post('/admin/verify-user', {
        user_id: userId,
        action,
      });
      fetchVerifications();
    } catch (err) {
      console.error('Erreur validation utilisateur', err);
    }
  };

  const handleToggleUserActive = async (userId: number) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      fetchModerationData();
    } catch (err) {
      console.error('Erreur toggle actif', err);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet avis ?')) return;
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      fetchModerationData();
    } catch (err) {
      console.error('Erreur suppression avis', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Espace Administration
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Supervision des vérifications d'identité et modération de la plateforme
            </p>
          </div>
        </div>

        {/* 2 Onglets Uniques imposés par GEMINI.md */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
              activeTab === 'verifications'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Vérifications ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
              activeTab === 'moderation'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Modération
          </button>
        </div>
      </div>

      {/* Onglet 1 : Vérifications d'identité */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Comptes en attente de vérification
          </h2>

          {loadingVerif ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : pendingUsers.length > 0 ? (
            <div className="space-y-4">
              {pendingUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">
                        {u.profile?.first_name} {u.profile?.last_name}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')} • {u.email}
                    </p>
                    {u.profile?.verification_doc_url ? (
                      <div className="text-xs pt-1">
                        <span className="text-slate-600">Document soumis : </span>
                        <a
                          href={u.profile.verification_doc_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 font-semibold underline inline-flex items-center gap-1"
                        >
                          <Eye size={12} /> Voir la pièce justificative
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600">Aucun document joint</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleVerify(u.id, 'APPROVE')}
                      className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                    >
                      <Check size={14} />
                      <span>APPROUVER</span>
                    </button>
                    <button
                      onClick={() => handleVerify(u.id, 'REJECT')}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <X size={14} />
                      <span>REJETER</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-100">
              Aucun justificatif en attente de vérification. Tout est à jour !
            </div>
          )}
        </div>
      )}

      {/* Onglet 2 : Modération */}
      {activeTab === 'moderation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Modération des Utilisateurs */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Gestion & Suspension des comptes</h2>

            {loadingMod ? (
              <div className="h-40 animate-pulse bg-slate-50 rounded-2xl" />
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {allUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-800">
                        {u.profile?.first_name} {u.profile?.last_name}{' '}
                        <span className="text-xs text-slate-400 font-normal">({u.role})</span>
                      </div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>

                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleToggleUserActive(u.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                          u.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {u.is_active ? 'Suspendre' : 'Réactiver'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modération des Avis */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Modération des Avis</h2>

            {loadingMod ? (
              <div className="h-40 animate-pulse bg-slate-50 rounded-2xl" />
            ) : allReviews.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {allReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">
                          {rev.parent?.profile?.first_name} {rev.parent?.profile?.last_name}
                        </span>
                        <span className="text-amber-500 font-bold text-xs">⭐ {rev.rating}/5</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">"{rev.comment}"</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      title="Supprimer l'avis"
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 transition shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucun avis publié sur la plateforme.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

