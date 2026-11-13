import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Baby, Lock, Mail } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const initialRole = (searchParams.get('role') as UserRole) || 'PARENT';

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [role, setRole] = useState<UserRole>(initialRole);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const res = await api.post('/auth/login', {
          email,
          password,
        });
        await login(res.data.access_token);
        navigate('/dashboard');
      } else {
        const res = await api.post('/auth/register', {
          email,
          password,
          role,
          first_name: firstName,
          last_name: lastName,
          city,
          postal_code: postalCode,
        });
        await login(res.data.access_token);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue lors de l\'authentification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-blue-600 font-bold text-2xl tracking-tight mb-2">
            <div className="bg-blue-600 text-white p-2 rounded-xl">
              <Baby size={24} />
            </div>
            <span>BabyApp</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === 'login' ? 'Connexion à votre compte' : 'Créer un nouveau compte'}
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            {activeTab === 'login' ? 'Accédez à votre espace sécurisé' : 'Rejoignez la communauté des parents et babysitters'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Inscription
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs sm:text-sm rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'register' && (
            <>
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Je suis un :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('PARENT')}
                    className={`py-3 px-3 text-sm font-bold rounded-xl border flex flex-col items-center gap-1 transition ${
                      role === 'PARENT'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Parent</span>
                    <span className="text-[11px] font-normal text-slate-500">Cherche babysitter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('BABYSITTER')}
                    className={`py-3 px-3 text-sm font-bold rounded-xl border flex flex-col items-center gap-1 transition ${
                      role === 'BABYSITTER'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Babysitter</span>
                    <span className="text-[11px] font-normal text-slate-500">Propose ses services</span>
                  </button>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* City and Postal Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ville</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Orléans"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Code Postal</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 45000"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse Email</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition duration-150 shadow-md disabled:opacity-50 mt-4"
          >
            {loading
              ? 'Traitement...'
              : activeTab === 'login'
              ? 'SE CONNECTER'
              : 'CRÉER MON COMPTE'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          <p>Comptes de test préconfigurés :</p>
          <p className="mt-1">Parent: <span className="font-mono text-slate-700">marie.dupont@example.com</span> (pwd: password123)</p>
          <p>Babysitter: <span className="font-mono text-slate-700">sophie.martin@example.com</span> (pwd: password123)</p>
          <p>Admin: <span className="font-mono text-slate-700">admin@babyapp.fr</span> (pwd: admin123)</p>
        </div>
      </div>
    </div>
  );
};

