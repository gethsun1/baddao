import React from 'react';

export const NetworkMotif = ({ className = "w-24 h-24 opacity-20" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
    <circle cx="50" cy="10" r="4" fill="currentColor" />
    <circle cx="85" cy="30" r="3" fill="currentColor" />
    <circle cx="85" cy="70" r="4" fill="currentColor" />
    <circle cx="50" cy="90" r="3" fill="currentColor" />
    <circle cx="15" cy="70" r="5" fill="currentColor" />
    <circle cx="15" cy="30" r="3" fill="currentColor" />
    <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
    
    <path d="M 50 14 L 50 42" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <path d="M 81 32 L 57 46" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <path d="M 19 32 L 43 46" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <path d="M 19 68 L 43 54" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <path d="M 81 68 L 57 54" stroke="currentColor" strokeWidth="1" opacity="0.5" />
  </svg>
);
