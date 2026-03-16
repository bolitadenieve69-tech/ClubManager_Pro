import React from 'react';

export const PadelLogo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <mask id="racket-holes">
          <rect width="100" height="100" fill="white" />
          {/* Grid of holes */}
          <circle cx="50" cy="25" r="3" fill="black" />
          <circle cx="36" cy="32" r="3" fill="black" />
          <circle cx="64" cy="32" r="3" fill="black" />
          <circle cx="50" cy="42" r="3" fill="black" />
          <circle cx="36" cy="52" r="3" fill="black" />
          <circle cx="64" cy="52" r="3" fill="black" />
          <circle cx="50" cy="62" r="3" fill="black" />
        </mask>
      </defs>

      {/* Racket Head */}
      <path 
        d="M50 5C28 5 10 22 10 43C10 57 18 69 30 76L34 95H66L70 76C82 69 90 57 90 43C90 22 72 5 50 5Z" 
        fill="currentColor" 
        mask="url(#racket-holes)"
      />
      
      {/* Handle Detail (Grip) */}
      <rect x="44" y="82" width="12" height="3" fill="white" fillOpacity="0.3" />
      <rect x="44" y="88" width="12" height="3" fill="white" fillOpacity="0.3" />
    </svg>
  );
};
