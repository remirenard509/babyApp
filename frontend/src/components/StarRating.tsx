import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 18,
  interactive = false,
  onRatingChange,
}) => {
  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: maxStars }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= Math.round(rating);

        return (
          <button
            type="button"
            key={i}
            disabled={!interactive}
            onClick={() => interactive && onRatingChange && onRatingChange(starValue)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <Star
              size={size}
              className={`${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

