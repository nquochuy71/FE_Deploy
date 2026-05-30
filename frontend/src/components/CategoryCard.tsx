import React, { useState } from 'react';
import type { CategorySummaryResponse } from '../types/catalog';

interface CategoryCardProps {
  category: CategorySummaryResponse;
  onClick?: (category: CategorySummaryResponse) => void;
}

const iconMap: Record<string, string> = {
  'chăm-sóc-da': '💧',
  'trang-điểm': '💄',
  'chăm-sóc-tóc': '✂️',
  'chăm-sóc-cơ-thể': '🧴',
  'chăm-sóc-nắng': '☀️',
  'bộ-quà-tặng': '🎁',
};

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = category.imageUrl?.trim();
  const shouldShowImage = Boolean(imageUrl) && !imageFailed;
  const icon = iconMap[category.slug.toLowerCase()] || '✨';

  return (
    <button type="button" className="category-card" onClick={() => onClick?.(category)}>
      <div className="category-card__media">
        {shouldShowImage ? (
          <img
            src={imageUrl}
            alt={category.name}
            className="category-card__image"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="category-card__fallback" aria-hidden="true">
            <span className="category-card__icon">{icon}</span>
          </div>
        )}
      </div>

      <div className="category-card__content">
        <h3 className="category-card__name">{category.name}</h3>
      </div>
    </button>
  );
};
