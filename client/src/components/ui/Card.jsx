import React from 'react';

export default function Card({ children, title, subtitle, action, className = '', bodyClassName = '', headerClassName = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-semibold text-slate-800">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
