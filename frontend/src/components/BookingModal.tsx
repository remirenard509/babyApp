import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { Profile } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  babysitter: Profile;
  onSuccess?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  babysitter,
  onSuccess,
}) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('22:00');
  const [childrenCount, setChildrenCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const rate = babysitter.hourly_rate || 12;

  // Calcul du prix estimé
  const calculateTotal = () => {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let hours = (endH + endM / 60) - (startH + startM / 60);
    if (hours <= 0) hours += 24;
    return Math.round(hours * rate * 100) / 100;
  };

  const totalPrice = calculateTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/bookings', {
        babysitter_id: babysitter.user_id,
        date,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        children_count: Number(childrenCount),
        notes,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la réservation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            Réserver avec {babysitter.first_name}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center flex flex-col items-center">
            <CheckCircle2 size={56} className="text-emerald-500 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Demande envoyée !</h3>
            <p className="text-slate-600 text-sm">
              Votre demande a bien été transmise à {babysitter.first_name}. Vous serez notifié dès son acceptation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Date de la garde
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Heure de début
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Heure de fin
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Nombre d'enfants
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={childrenCount}
                onChange={(e) => setChildrenCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Remarques / Instructions particulières
              </label>
              <textarea
                rows={3}
                placeholder="Ex : Habitudes de coucher, allergies, numéro d'urgence..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
              <span className="text-sm text-slate-600 font-medium">Prix estimé ({rate} €/h) :</span>
              <span className="text-xl font-bold text-orange-500">{totalPrice} €</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition duration-150 shadow-sm disabled:opacity-50"
            >
              {loading ? 'Envoi en cours...' : `Demander la réservation (${totalPrice} €)`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

