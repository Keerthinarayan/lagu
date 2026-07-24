import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center animate-fade-in px-2">
      <p className="text-xs font-semibold tracking-[0.25em] uppercase text-neutral-400 mb-5">
        Kannada Prosody · ಛಂದಸ್ಸು
      </p>
      <h1 className="font-kannada text-6xl sm:text-7xl md:text-8xl font-extrabold text-neutral-900 tracking-tight leading-none">
        ಅಕ್ಷರ
      </h1>
      <p className="mt-5 text-lg sm:text-xl text-indigo-600 font-semibold">
        Advanced Kannada Prosody &amp; Text Analysis
      </p>
    </header>
  );
};

export default Header;
