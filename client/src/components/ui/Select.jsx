import React, { forwardRef } from 'react';

const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      options = [],
      placeholder = 'Select an option',
      className = '',
      id,
      required = false,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          required={required}
          className={`block w-full rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed px-3 py-2 bg-white ${
            error
              ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
              : 'border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500'
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const value = typeof opt === 'object' ? opt.value : opt;
            const label = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
        {error ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
