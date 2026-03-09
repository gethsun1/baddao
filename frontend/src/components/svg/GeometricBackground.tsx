import React from 'react';

export const GeometricBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
    <svg className="absolute w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="gridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2F6BFF" strokeWidth="1" />
          <circle cx="60" cy="0" r="1.5" fill="#4FD1FF" />
          <circle cx="0" cy="60" r="1.5" fill="#4FD1FF" />
        </pattern>
        <pattern id="hexPattern" width="100" height="173.2" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
            <path d="M50 0 L100 28.86 L100 86.6 L50 115.47 L0 86.6 L0 28.86 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
            <path d="M50 86.6 L100 115.47 L100 173.2 L50 202.07 L0 173.2 L0 115.47 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
            <path d="M0 86.6 L50 115.47 L50 173.2 L0 202.07 L-50 173.2 L-50 115.47 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
            <path d="M100 86.6 L150 115.47 L150 173.2 L100 202.07 L50 173.2 L50 115.47 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      
      {/* Background Grid */}
      <rect width="100%" height="100%" fill="url(#gridPattern)" />
      
      {/* Hex Overlay */}
      <rect width="100%" height="100%" fill="url(#hexPattern)" opacity="0.5" />
      
      {/* Subtle glowing orbs */}
      <circle cx="20%" cy="30%" r="400" fill="url(#glowGradient1)" opacity="0.1" />
      <circle cx="80%" cy="70%" r="300" fill="url(#glowGradient2)" opacity="0.1" />
      
      <defs>
        <radialGradient id="glowGradient1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2F6BFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#2F6BFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowGradient2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF3C00" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FF3C00" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  </div>
);
