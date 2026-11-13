import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Les 8 pages strictes définies dans GEMINI.md
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { SearchPage } from './pages/SearchPage';
import { BabysitterDetailPage } from './pages/BabysitterDetailPage';
import { OffersPage } from './pages/OffersPage';
import { MessagesPage } from './pages/MessagesPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/babysitters/:id" element={<BabysitterDetailPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* Redirection vers l'accueil si route inconnue */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;

