'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const OrbitNetwork = () => {
  return (
    <div className="relative w-full aspect-square max-w-[500px] mx-auto opacity-80 pointer-events-none">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Central Core */}
        <circle cx="200" cy="200" r="30" fill="#141B2D" stroke="#2F6BFF" strokeWidth="2" filter="url(#glow)"/>
        <circle cx="200" cy="200" r="20" fill="#0B1220" />
        <circle cx="200" cy="200" r="8" fill="#FF3C00" filter="url(#glow)"/>

        {/* Orbit Rings */}
        <motion.circle 
          cx="200" cy="200" r="80" 
          fill="none" stroke="rgba(79, 209, 255, 0.2)" strokeWidth="1" strokeDasharray="4 4"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: 'center' }}
        />
        <motion.circle 
          cx="200" cy="200" r="140" 
          fill="none" stroke="rgba(47, 107, 255, 0.15)" strokeWidth="1" strokeDasharray="8 8"
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: 'center' }}
        />

        {/* Nodes on Inner Orbit */}
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: 'center' }}>
          <circle cx="280" cy="200" r="6" fill="#4FD1FF" filter="url(#glow)" />
          <circle cx="120" cy="200" r="4" fill="#E6E8F0" />
          <circle cx="200" cy="120" r="5" fill="#2F6BFF" />
          
          {/* Connections to core */}
          <line x1="280" y1="200" x2="225" y2="200" stroke="rgba(79, 209, 255, 0.4)" strokeWidth="1" />
          <line x1="120" y1="200" x2="175" y2="200" stroke="rgba(230, 232, 240, 0.2)" strokeWidth="1" />
          <line x1="200" y1="120" x2="200" y2="175" stroke="rgba(47, 107, 255, 0.4)" strokeWidth="1" />
        </motion.g>

        {/* Nodes on Outer Orbit */}
        <motion.g animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: 'center' }}>
          <circle cx="340" cy="200" r="8" fill="#FF3C00" filter="url(#glow)" />
          <circle cx="60" cy="200" r="5" fill="#4FD1FF" />
          <circle cx="200" cy="60" r="6" fill="#2F6BFF" />
          <circle cx="200" cy="340" r="4" fill="#E6E8F0" />
          
          {/* Inter-node connections on outer orbit */}
          <path d="M 340 200 Q 270 60 200 60" fill="none" stroke="rgba(255, 60, 0, 0.15)" strokeWidth="1" />
          <path d="M 60 200 Q 130 340 200 340" fill="none" stroke="rgba(79, 209, 255, 0.15)" strokeWidth="1" />
          
          {/* Connections to inner elements */}
          <line x1="340" y1="200" x2="280" y2="200" stroke="rgba(255, 60, 0, 0.3)" strokeWidth="1" />
        </motion.g>

      </svg>
    </div>
  );
};
