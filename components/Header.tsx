import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center animate-fade-in">
      <div className="inline-block">
        <h1 className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 drop-shadow-2xl animate-gradient pb-2">
          LaghuGuru Analyzer
        </h1>
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full animate-shimmer"></div>
      </div>
      <p className="mt-4 text-xl text-slate-300 font-kannada tracking-wide">
        ಕನ್ನಡ ಛಂದಸ್ಸು ವಿಶ್ಲೇಷಕ
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Advanced Kannada Prosody & Text Analysis Tool
      </p>
    </header>
  );
};

export default Header;