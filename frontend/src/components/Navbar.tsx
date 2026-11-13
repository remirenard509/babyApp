import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Baby, Menu, X, MessageSquare, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 text-blue-600 font-bold text-xl tracking-tight">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <Baby size={22} />
          </div>
          <span>BabyApp</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          <Link
            to="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Accueil
          </Link>
          <Link
            to="/search"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/search') ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Rechercher
          </Link>
          <Link
            to="/offers"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/offers') ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Offres
          </Link>
          {user && (
            <Link
              to="/messages"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                isActive('/messages') ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquare size={16} />
              <span>Messages</span>
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                isActive('/admin') ? 'text-purple-600 bg-purple-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Shield size={16} />
              <span>Administration</span>
            </Link>
          )}
        </nav>

        {/* Desktop Auth CTA */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                <User size={16} />
                <span>Mon Espace ({user.role === 'PARENT' ? 'Parent' : user.role === 'BABYSITTER' ? 'Babysitter' : 'Admin'})</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Déconnexion"
                className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-100 transition"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/auth?tab=login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
              >
                Connexion
              </Link>
              <Link
                to="/auth?tab=register"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center space-x-2">
          {user && (
            <Link to="/messages" className="p-2 text-slate-600 hover:text-blue-600">
              <MessageSquare size={20} />
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 rounded-xl hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Accueil
          </Link>
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Rechercher
          </Link>
          <Link
            to="/offers"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Offres
          </Link>
          {user && (
            <Link
              to="/messages"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Messages
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-purple-700 hover:bg-purple-50"
            >
              Administration
            </Link>
          )}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 px-4 bg-slate-100 font-semibold text-slate-800 rounded-xl"
                >
                  Mon Espace Personnel
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-center py-2.5 px-4 text-red-600 font-semibold rounded-xl hover:bg-red-50"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth?tab=login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 px-4 border border-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Connexion
                </Link>
                <Link
                  to="/auth?tab=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-xl shadow-xs"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

