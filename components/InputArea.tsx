import React, { useRef, useState } from 'react';

interface InputAreaProps {
  text: string;
  setText: (text: string) => void;
  onAnalyze: () => void;
  onFileUpload: (file: File, forceOcr: boolean) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ text, setText, onAnalyze, onFileUpload, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [forceOcr, setForceOcr] = useState(false);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file, forceOcr);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white p-5 sm:p-7 md:p-8 rounded-2xl border border-neutral-200 shadow-sm">
      <label htmlFor="poem-input" className="flex items-center gap-2 text-sm font-semibold tracking-[0.15em] uppercase text-neutral-400 mb-4">
        Enter Kannada Text or Upload a File
      </label>

      <div className="relative">
        <textarea
          id="poem-input"
          rows={6}
          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 sm:p-5 text-neutral-900 font-kannada text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-y placeholder:text-neutral-400"
          placeholder="ನಿಮ್ಮ ಪದ್ಯವನ್ನು ಇಲ್ಲಿ ನಮೂದಿಸಿ..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isLoading}
        />
        {text && (
          <div className="absolute bottom-3 right-3 bg-white/90 px-2.5 py-1 rounded-lg border border-neutral-200">
            <span className="text-xs font-mono text-neutral-400">{text.length} characters</span>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-3">
        <svg className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-neutral-500 leading-relaxed">
            You can upload <code className="bg-white text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs border border-neutral-200">.pdf</code>, <code className="bg-white text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs border border-neutral-200">.docx</code>, or <code className="bg-white text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs border border-neutral-200">.txt</code> files. If a Kannada PDF has font-encoding issues or is scanned, the app automatically switches to <span className="text-indigo-600 font-medium">OCR</span> to read the text — this may take a little longer.
          </p>
          <label className="mt-2 flex items-center gap-2 text-sm text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={forceOcr}
              onChange={(e) => setForceOcr(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500/30"
            />
            Force OCR for PDFs
            <span className="text-neutral-400">(use if the extracted text looks garbled or jumbled)</span>
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row justify-end items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.docx,.txt"
          disabled={isLoading}
        />
        <button
          onClick={handleFileButtonClick}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-3 bg-white text-neutral-700 font-semibold rounded-full border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          Upload File
        </button>
        <button
          onClick={onAnalyze}
          disabled={isLoading || !text.trim()}
          className="w-full sm:w-auto px-8 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Analyze Text
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputArea;
