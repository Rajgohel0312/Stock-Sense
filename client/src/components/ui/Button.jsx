import React from 'react';
import Spinner from './Spinner';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm active:bg-indigo-800',
    secondary:
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-400 shadow-sm active:bg-slate-100',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm active:bg-rose-800',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm active:bg-emerald-800',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400',
    warning:
      'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 shadow-sm active:bg-amber-700',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" className={variant === 'secondary' || variant === 'ghost' ? 'text-slate-600' : 'text-white'} />
      ) : (
        Icon && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
    </button>
  );
}
