import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin } from 'lucide-react';
import { Profile } from '../types';
import { StarRating } from './StarRating';

interface BabysitterCardProps {
  profile: Profile;
}

export const BabysitterCard: React.FC<BabysitterCardProps> = ({ profile }) => {
  const avatar = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name + ' ' + profile.last_name)}&background=2563EB&color=fff`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <img
                src={avatar}
                alt={`${profile.first_name}`}
                className="w-14 h-14 rounded-full object-cover border-2 border-slate-100"
              />
              {profile.is_verified && (
                <div
                  title="Profil Vérifié"
                  className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm"
                >
                  <ShieldCheck size={14} />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-bold text-slate-800 text-lg leading-tight">
                  {profile.first_name}
                </h3>
                {profile.calculated_age && (
                  <span className="text-slate-500 text-sm">
                    ({profile.calculated_age} ans)
                  </span>
                )}
              </div>
              <div className="flex items-center text-slate-500 text-xs mt-1">
                <MapPin size={13} className="mr-1 text-slate-400" />
                <span>{profile.city} {profile.postal_code ? `(${profile.postal_code})` : ''}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-base font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg inline-block">
              {profile.hourly_rate ? `${profile.hourly_rate} €/h` : '12 €/h'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <StarRating rating={profile.average_rating || 5} size={15} />
          <span className="text-xs font-semibold text-slate-700">
            {profile.average_rating ? profile.average_rating.toFixed(1) : '5.0'}
          </span>
          <span className="text-xs text-slate-400">
            ({profile.reviews_count || 0} avis)
          </span>
        </div>

        <p className="text-slate-600 text-sm line-clamp-2 mb-4 leading-relaxed">
          {profile.bio || "Babysitter motivé(e) et attentif(ve) au bien-être des enfants."}
        </p>
      </div>

      <Link
        to={`/babysitters/${profile.user_id}`}
        className="w-full block text-center py-2.5 px-4 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold text-sm rounded-xl transition-colors duration-200"
      >
        Voir le profil
      </Link>
    </div>
  );
};

