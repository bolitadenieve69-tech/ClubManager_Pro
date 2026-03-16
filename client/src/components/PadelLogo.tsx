import React from 'react';

export const PadelLogo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Frame of the Padel Racket */}
      <path 
        d="M50 10C30 10 15 25 15 45C15 58 22 69 32 75L35 90H65L68 75C78 69 85 58 85 45C85 25 70 10 50 10Z" 
        fill="currentColor" 
      />
      {/* Grid of holes to make it look like a Padel racket */}
      <circle cx="50" cy="30" r="2.5" fill="white" fillOpacity="0.4" />
      <circle cx="38" cy="35" r="2.5" fill="white" fillOpacity="0.4" />
      <circle cx="62" cy="35" r="2.5" fill="white" fillOpacity="0.4" />
      <circle cx="50" cy="45" r="2.5" fill="white" fillOpacity="0.4" />
      <circle cx="38" cy="55" r="2.5" fill="white" fillOpacity="0.4" />
      <circle cx="62" cy="55" r="2.5" fill="white" fillOpacity="0.4" />
      <circle cx="50" cy="65" r="2.5" fill="white" fillOpacity="0.4" />
      
      {/* Handle detail */}
      <rect x="42" y="80" width="16" height="4" rx="1" fill="white" fillOpacity="0.2" />
    </svg>
  );
};
