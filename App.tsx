import React, { useState, useCallback, useEffect } from 'react';
import { analyzePoem, analyzeTextStats } from './services/kannadaAnalyzer';
import { parseFile } from './services/fileParser';
import { PoemAnalysis, ViewMode, TextStatsAnalysis, Syllable } from './types';
import Header from './components/Header';
import InputArea from './components/InputArea';
import ResultsDisplay from './components/ResultsDisplay';
import AiAnalysisPage from './components/AiAnalysisPage';
import NavBar, { Page } from './components/NavBar';
import Footer from './components/Footer';

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
const [poemText, setPoemText] = useState<string>(`ಜನಪನಂಘಿಗೆ ಮಣಿದು ಕೈ ಮುಗಿ
ದೆನಗೆ ಬೆಸಸೈ ಬೊಪ್ಪ ತಾ ಬ
ಲ್ಲೆನು ಮಹಾಹವದೊಳಗೆ ಪದ್ಮವ್ಯೂಹ ಭೇದನವ
ಅನುವರವ ಗೆಲುವೆನು ಕೃತಾಂತನ
ಮನೆಗೆ ಕಳುಹುವೆನಹಿತರನು ನೀ
ನಿನಿತು ಚಿಂತಿಸಲೇಕೆ ಕಾಳಗಕೆನ್ನ ಕಳುಹೆಂದ.`);
  const [poemAnalysis, setPoemAnalysis] = useState<PoemAnalysis | null>(null);
  const [textStats, setTextStats] = useState<TextStatsAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('highlight');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [activePage, setActivePage] = useState<Page>('akshara');

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
        // Jump to the report page so the user sees their results immediately.
        setActivePage('report');
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
    setProgressMessage('Reading the file…');

    try {
      const text = await parseFile(file, setProgressMessage);
      setPoemText(text);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred while parsing the file.");
      }
    } finally {
      setIsLoading(false);
      setProgressMessage('');
    }
  }, []);

  // Flatten the per-line syllables into a single ordered list for AI comparison.
  const localSyllables: Syllable[] = poemAnalysis
    ? poemAnalysis.lines.flatMap((line) => line.syllables)
    : [];

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-neutral-900 flex flex-col">
      <NavBar activePage={activePage} onNavigate={setActivePage} hasAnalysis={!!poemAnalysis} />

      <div className="flex-1 w-full px-4 sm:px-6 md:px-8 pt-16 sm:pt-20">
        <div className="w-full max-w-4xl mx-auto">
          {activePage === 'akshara' && <Header />}
          <main className="mt-10 sm:mt-12">

          {/* ---------- Akshara (input) page ---------- */}
          {/* Pages stay mounted and are only hidden via CSS, so state inside
              them (chat history, AI comparison results, report tab) survives
              switching to another page and back. */}
          <div className={activePage === 'akshara' ? 'animate-fade-in' : 'hidden'}>
              <InputArea
                text={poemText}
                setText={setPoemText}
                onAnalyze={handleAnalyze}
                onFileUpload={handleFileUpload}
                isLoading={isLoading}
              />
              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-center animate-fade-in">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}
              {isLoading && (
                <div className="flex justify-center items-center mt-8 p-10 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg text-neutral-700 font-medium text-center">{progressMessage || 'Processing your text...'}</p>
                </div>
              )}
          </div>

          {/* ---------- Analysis Report page ---------- */}
          <div className={activePage === 'report' ? '' : 'hidden'}>
            {poemAnalysis && textStats ? (
              <ResultsDisplay
                poemAnalysis={poemAnalysis}
                textStats={textStats}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-12 text-center animate-fade-in">
                <svg className="w-14 h-14 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-neutral-500 mb-6">No analysis yet. Enter or upload Kannada text to see the report.</p>
                <button
                  onClick={() => setActivePage('akshara')}
                  className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-700 transition-all"
                >
                  Go to Analyze
                </button>
              </div>
            )}
          </div>

          {/* ---------- AI Analysis page (Compare + Chat) ---------- */}
          <div className={activePage === 'ai' ? '' : 'hidden'}>
            <AiAnalysisPage
              poemText={poemText}
              localSyllables={localSyllables}
              hasAnalysis={!!poemAnalysis}
              onGoToInput={() => setActivePage('akshara')}
            />
          </div>
        </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default App;
