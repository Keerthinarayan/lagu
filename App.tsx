
import React, { useState, useCallback } from 'react';
import { analyzePoem } from './services/kannadaAnalyzer';
import { PoemAnalysis, ViewMode } from './types';
import Header from './components/Header';
import InputArea from './components/InputArea';
import ResultsDisplay from './components/ResultsDisplay';

const App: React.FC = () => {
  const [poemText, setPoemText] = useState<string>('ನದಿ ತೀರದಲಿ ಹಕ್ಕಿಯ ಕೂಗು\nಮರದ ನಿಂತರಲಿ ಗಾಳಿ ಬೀಸು');
  const [analysisResult, setAnalysisResult] = useState<PoemAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('pattern');
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(() => {
    if (!poemText.trim()) {
      setError("Please enter some Kannada text to analyze.");
      setAnalysisResult(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    // Simulate async operation for better UX
    setTimeout(() => {
      try {
        const result = analyzePoem(poemText);
        setAnalysisResult(result);
      } catch (e) {
        if (e instanceof Error) {
          setError(`An error occurred during analysis: ${e.message}`);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, [poemText]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <Header />
        <main className="mt-8">
          <InputArea
            text={poemText}
            setText={setPoemText}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />
          {error && (
            <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}
          {isLoading && (
             <div className="flex justify-center items-center mt-8 p-8 bg-gray-800/50 rounded-lg">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">Analyzing your poem...</p>
            </div>
          )}
          {analysisResult && !isLoading && (
            <ResultsDisplay
              result={analysisResult}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
