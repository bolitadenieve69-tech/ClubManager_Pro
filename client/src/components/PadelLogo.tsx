import React from 'react';

export const PadelLogo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Racket Frame */}
      <path 
        d="M50 15C35 15 22 27 22 42C22 52 28 61 38 66L42 85H58L62 66C72 61 78 52 78 42C78 27 65 15 50 15Z" 
        fill="currentColor" 
      />
      {/* Holes pattern (abstract) */}
      <circle cx="50" cy="32" r="3" fill="white" fillOpacity="0.3" />
      <circle cx="40" cy="38" r="3" fill="white" fillOpacity="0.3" />
      <circle cx="60" cy="38" r="3" fill="white" fillOpacity="0.3" />
      <circle cx="50" cy="44" r="3" fill="white" fillOpacity="0.3" />
      <circle cx="40" cy="50" r="3" fill="white" fillOpacity="0.3" />
      <circle cx="60" cy="50" r="3" fill="white" fillOpacity="0.3" />
      {/* Accent Line */}
      <path 
        d="M42 85L50 65L58 85" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};
