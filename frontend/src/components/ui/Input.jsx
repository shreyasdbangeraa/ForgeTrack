import React from 'react';

export const Input = ({ label, helperText, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && <label className="text-xs font-bold uppercase tracking-widest text-fg-tertiary mb-2 ml-1">{label}</label>}
      <input 
        className={`neon-input ${error ? '!border-danger/50' : ''}`}
        {...props}
      />
      {error && <span className="text-xs text-danger mt-1.5 ml-1">{error}</span>}
      {helperText && !error && <span className="text-xs text-fg-tertiary mt-1.5 ml-1">{helperText}</span>}
    </div>
  );
};

export const Select = ({ label, options, className = '', ...props }) => {
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && <label className="text-xs font-bold uppercase tracking-widest text-fg-tertiary mb-2 ml-1">{label}</label>}
      <div className="relative">
        <select 
          className="neon-input appearance-none !pr-10 cursor-pointer" 
          {...props}
        >
          {options.map((opt, i) => (
            <option key={i} value={opt.value} className="bg-[#0f0f0f] text-white">{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-fg-tertiary">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};
