import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-24 border-t border-neutral-200">
      <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="font-kannada text-lg font-bold text-neutral-900">ಅಕ್ಷರ</p>
          <p className="text-sm text-neutral-500 mt-0.5">Advanced Kannada Prosody &amp; Text Analysis</p>
        </div>
        <div className="flex items-center gap-6 text-sm text-neutral-500">
          <span>ಲಘು · ಗುರು</span>
          <span className="text-neutral-300">|</span>
          <span>© {new Date().getFullYear()} Akshara</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
