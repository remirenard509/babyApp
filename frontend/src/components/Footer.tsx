import React from 'react';
import { Link } from 'react-router-dom';
import { Baby, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2 text-white font-bold text-lg">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Baby size={20} />
            </div>
            <span>BabyApp</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/" className="hover:text-white transition">Mentions légales</Link>
            <Link to="/" className="hover:text-white transition">Politique de confidentialité</Link>
            <Link to="/" className="hover:text-white transition">Contact</Link>
            <Link to="/" className="hover:text-white transition">Centre d'aide</Link>
          </div>

          <div className="text-xs flex items-center gap-1 text-slate-500">
            <span>Conçu avec</span>
            <Heart size={14} className="text-red-500 fill-red-500" />
            <span>pour la sécurité des enfants</span>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} BabyApp Platform. Tous droits réservés. Spécifications conformes GEMINI.md.
        </div>
      </div>
    </footer>
  );
};

