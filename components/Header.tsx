import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center animate-fade-in px-2">
      <div className="inline-block">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 drop-shadow-2xl animate-gradient pb-2">
          Akshara
        </h1>
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full animate-shimmer"></div>
      </div>
      <p className="mt-3 sm:mt-4 text-lg sm:text-xl text-slate-300 font-kannada tracking-wide">
        ಕನ್ನಡ ಛಂದಸ್ಸು ವಿಶ್ಲೇಷಕ
      </p>
      <p className="mt-2 text-xs sm:text-sm text-slate-500 px-4">
        Advanced Kannada Prosody & Text Analysis Tool
      </p>
    </header>
  );
};

export default Header;