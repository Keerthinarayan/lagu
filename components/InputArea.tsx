import React, { useRef } from 'react';

interface InputAreaProps {
  text: string;
  setText: (text: string) => void;
  onAnalyze: () => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ text, setText, onAnalyze, onFileUpload, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset file input value to allow re-uploading the same file
    if(event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-800/60 via-slate-800/50 to-slate-900/60 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-md hover:border-amber-500/30 transition-all duration-500 group overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
      
      <div className="relative z-10">
        <label htmlFor="poem-input" className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold text-slate-200 mb-3 sm:mb-4 group-hover:text-amber-400 transition-colors duration-300">
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
          <span className="text-sm sm:text-base md:text-lg">Enter Kannada Text or Upload a File</span>
        </label>
        <div className="relative">
          <textarea
            id="poem-input"
            rows={6}
            className="w-full bg-gradient-to-br from-slate-950/80 to-slate-900/80 border-2 border-slate-700/50 rounded-xl p-4 sm:p-5 md:p-6 text-slate-100 font-kannada text-base sm:text-lg md:text-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 resize-y shadow-inner placeholder:text-slate-600 hover:border-slate-600/70 backdrop-blur-sm"
            placeholder="ನಿಮ್ಮ ಪದ್ಯವನ್ನು ಇಲ್ಲಿ ನಮೂದಿಸಿ..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />
          {/* Character count indicator */}
          {text && (
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-slate-800/90 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-lg border border-slate-700/50">
              <span className="text-xs font-mono text-slate-400">
                {text.length} characters
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 sm:mt-5 p-3 sm:p-4 md:p-5 bg-gradient-to-r from-amber-900/20 via-orange-900/20 to-slate-900/40 rounded-xl border border-amber-500/20 flex items-start space-x-2 sm:space-x-3 md:space-x-4 backdrop-blur-sm shadow-lg hover:border-amber-500/40 transition-all duration-300 group/tip">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-lg flex items-center justify-center border border-amber-500/30 group-hover/tip:scale-110 transition-transform duration-300">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-amber-300 mb-1">NOTE </p>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                You can upload <code className="bg-slate-800/70 text-amber-300 px-1.5 sm:px-2 py-0.5 rounded-md font-mono text-xs border border-amber-500/20">.pdf</code>, <code className="bg-slate-800/70 text-amber-300 px-1.5 sm:px-2 py-0.5 rounded-md font-mono text-xs border border-amber-500/20">.docx</code>, or <code className="bg-slate-800/70 text-amber-300 px-1.5 sm:px-2 py-0.5 rounded-md font-mono text-xs border border-amber-500/20">.txt</code> files. Due to font encoding issues, Kannada text from PDFs may not extract correctly. If you get garbled text, please copy and paste it from your PDF viewer for best results.
              </p>
            </div>
        </div>
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4">
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
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-br from-slate-700 to-slate-800 text-white font-semibold rounded-xl hover:from-slate-600 hover:to-slate-700 disabled:from-slate-800/50 disabled:to-slate-900/50 disabled:cursor-not-allowed disabled:text-slate-600 transition-all duration-300 ease-in-out flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-[1.02] border border-slate-600/50 hover:border-slate-500/70 group/btn relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            Upload File
          </button>
          <button
            onClick={onAnalyze}
            disabled={isLoading || !text.trim()}
            className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-amber-400 hover:via-orange-400 hover:to-orange-500 disabled:from-slate-700/50 disabled:to-slate-800/50 disabled:cursor-not-allowed disabled:text-slate-500 transition-all duration-300 ease-in-out flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 transform hover:-translate-y-1 hover:scale-[1.05] border border-amber-400/30 disabled:border-slate-700/50 relative overflow-hidden group/analyze"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/analyze:translate-x-[100%] transition-transform duration-700"></div>
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analyze Text
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;