import React from 'react';
import { STATUS_COLORS, TIER_COLORS } from '../../constants/statuses';

export default function Badge({
  children,
  variant = 'default',
  tier,
  size = 'md',
  className = '',
}) {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (tier && TIER_COLORS[tier.toLowerCase()]) {
    colorClass = TIER_COLORS[tier.toLowerCase()];
  } else if (variant && STATUS_COLORS[variant.toLowerCase()]) {
    colorClass = STATUS_COLORS[variant.toLowerCase()];
  }

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border uppercase tracking-wider ${sizes[size] || sizes.md} ${colorClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
