import React from 'react';

const ProsodyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M10 17c-4.418 0-8-1.119-8-2.5S5.582 12 10 12s8 1.119 8 2.5-3.582 2.5-8 2.5z"></path>
    <path d="M10 12c-4.418 0-8-1.119-8-2.5S5.582 7 10 7s8 1.119 8 2.5S14.418 12 10 12z"></path>
    <path d="M10 7c-4.418 0-8-1.119-8-2.5S5.582 2 10 2s8 1.119 8 2.5S14.418 7 10 7z"></path>
    <path d="M19 12v5m-3-2.5h6"></path>
  </svg>
);

export default ProsodyIcon;
