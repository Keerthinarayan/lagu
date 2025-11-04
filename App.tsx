import React, { useState, useCallback, useEffect } from 'react';
import { analyzePoem, analyzeTextStats } from './services/kannadaAnalyzer';
import { parseFile } from './services/fileParser';
import { PoemAnalysis, ViewMode, TextStatsAnalysis } from './types';
import Header from './components/Header';
import InputArea from './components/InputArea';
import ResultsDisplay from './components/ResultsDisplay';

// pdf.js worker setup
declare const pdfjsLib: any;

/**
 * Reformats a block of text by breaking long lines into shorter ones
 * for better display, without breaking words.
 * @param text The input text.
 * @param maxLineLength The desired maximum length for a line.
 * @returns The reformatted text with additional newlines.
 */
const reformatTextForDisplay = (text: string, maxLineLength: number = 70): string => {
    const originalLines = text.split('\n');
    const resultLines: string[] = [];

    originalLines.forEach(line => {
        if (line.trim().length <= maxLineLength) {
            resultLines.push(line);
            return;
        }

        const words = line.split(/\s+/);
        let currentLine = '';
        words.forEach(word => {
            if (currentLine.length === 0) {
                currentLine = word;
            } else if (currentLine.length + word.length + 1 <= maxLineLength) {
                currentLine += ' ' + word;
            } else {
                resultLines.push(currentLine);
                currentLine = word;
            }
        });
        if (currentLine.length > 0) {
            resultLines.push(currentLine);
        }
    });

    return resultLines.join('\n');
};


const App: React.FC = () => {
  const [poemText, setPoemText] = useState<string>("ರೀ ರಾಮಾಯಣ ದರ್ಶನಂ ಕೃತಜ್ಞತೆಗಳು ರಾಷ್ಟ್ರಕವಿ ಕುವೆಂಪು ಅವರ ಮಹಾಕಾವಯ 'ಶ್ರೀರಾಮಾಯಣದರ್ಶನಂ' ಕನನಡ ಸಾರಸ್ವತ ಪರಪಂಚದ ಮಹಾಸಿದ್ಧಿಗಳಲ್ಲಿ ಒಂದು.");
  const [poemAnalysis, setPoemAnalysis] = useState<PoemAnalysis | null>(null);
  const [textStats, setTextStats] = useState<TextStatsAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('highlight');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set the workerSrc for pdf.js. This is required for it to work correctly.
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
  }, []);


  const handleAnalyze = useCallback(() => {
    if (!poemText.trim()) {
      setError("Please enter or upload some Kannada text to analyze.");
      setPoemAnalysis(null);
      setTextStats(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setPoemAnalysis(null);
    setTextStats(null);

    // Simulate async operation for better UX
    setTimeout(() => {
      try {
        // Reformat text for prosody analysis display ONLY.
        // This breaks long paragraphs into shorter lines for readability.
        const formattedText = reformatTextForDisplay(poemText);
        
        // Use formatted text for prosody to get line-by-line display.
        const prosodyResult = analyzePoem(formattedText);
        // Use ORIGINAL text for stats to get accurate sentence/word counts.
        const statsResult = analyzeTextStats(poemText);

        setPoemAnalysis(prosodyResult);
        setTextStats(statsResult);
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

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setPoemAnalysis(null);
    setTextStats(null);
    setPoemText(''); // Clear previous text

    try {
      const text = await parseFile(file);
      setPoemText(text);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred while parsing the file.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 relative overflow-hidden">
      {/* Sophisticated animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-6000"></div>
        
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.08),transparent_50%)]"></div>
        
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen text-slate-200 flex flex-col items-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <Header />
          <main className="mt-8">
          <InputArea
            text={poemText}
            setText={setPoemText}
            onAnalyze={handleAnalyze}
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
          />
          {error && (
            <div className="mt-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/40 text-orange-200 px-5 py-4 rounded-xl text-center backdrop-blur-sm shadow-lg shadow-orange-500/10 animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
          {isLoading && !poemAnalysis && (
             <div className="flex justify-center items-center mt-8 p-10 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl backdrop-blur-md border border-slate-700/50 shadow-2xl">
                <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl text-slate-200 font-medium">Processing your text...</p>
            </div>
          )}
          {poemAnalysis && textStats && !isLoading && (
            <ResultsDisplay
              poemAnalysis={poemAnalysis}
              textStats={textStats}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          )}
        </main>
        </div>
      </div>
    </div>
  );
};

export default App;