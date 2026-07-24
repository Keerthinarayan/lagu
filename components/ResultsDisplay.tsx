import React, { useState } from 'react';
import { PoemAnalysis, ViewMode, TextStatsAnalysis } from '../types';
import ExportIcon from './icons/ExportIcon';
import ProsodyIcon from './icons/ProsodyIcon';
import StatsIcon from './icons/StatsIcon';

interface ResultsDisplayProps {
  poemAnalysis: PoemAnalysis;
  textStats: TextStatsAnalysis;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

type MainTab = 'prosody' | 'stats';
type StatsTab = 'summary' | 'chars' | 'phrases';

const StatCard: React.FC<{ label: string; value: number | string; accent?: string }> = ({ label, value, accent }) => (
  <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200">
    <p className="text-xs font-semibold text-neutral-400 mb-1 uppercase tracking-wide">{label}</p>
    <p className={`text-3xl sm:text-4xl font-bold ${accent || 'text-neutral-900'}`}>{value}</p>
  </div>
);

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ poemAnalysis, textStats, viewMode, setViewMode }) => {
  const [mainTab, setMainTab] = useState<MainTab>('prosody');
  const [statsTab, setStatsTab] = useState<StatsTab>('summary');
  const [charSearch, setCharSearch] = useState('');
  const [phraseSearch, setPhraseSearch] = useState('');

  const filteredCharacterFrequency = charSearch.trim()
    ? textStats.characterFrequency.filter(({ character }) => character === charSearch.trim())
    : textStats.characterFrequency;

  const filteredNGramEntries = Object.entries(textStats.nGramFrequencies)
    .map(([n, ngrams]) => {
      const filtered = phraseSearch.trim()
        ? ngrams.filter((g) => g.phrase.includes(phraseSearch.trim()))
        : ngrams;
      return [n, filtered] as const;
    })
    .filter(([, ngrams]) => ngrams.length > 0);

  const handleExport = () => {
    let report = `Akshara Analysis Report\n`;
    report += `=========================\n\n`;

    report += `--- Prosody Analysis ---\n`;
    report += `Total Laghu (ಲ): ${poemAnalysis.totalLaghu}\n`;
    report += `Total Guru (ಗು): ${poemAnalysis.totalGuru}\n\n`;
    poemAnalysis.lines.forEach(line => {
      report += `Line ${line.lineNumber}: ${line.originalText}\n`;
      const formattedPattern = line.pattern.replace(/\n/g, '\n         ');
      report += `Pattern: ${formattedPattern}\n\n`;
    });

    report += `--- Statistical Analysis ---\n`;
    report += `Total Words: ${textStats.totalWords}\n`;
    report += `Total Sentences: ${textStats.totalSentences}\n`;
    report += `Average Words Per Sentence: ${textStats.averageWordsPerSentence}\n`;
    report += `Average Word Length: ${textStats.averageWordLength} characters\n\n`;

    report += `Character Frequency (Alphabetical):\n`;
    textStats.characterFrequency.forEach(item => {
        report += `- ${item.character}: ${item.count}\n`;
    });
    report += `\n`;

    report += `Common Phrases & Word Frequency:\n`;
    Object.entries(textStats.nGramFrequencies).forEach(([n, ngrams]) => {
        const title = n === '1' ? 'Word Frequency (Top 20)' : `Top ${n}-Word Phrases`;
        report += `${title}:\n`;
        ngrams.forEach(ngram => {
            report += `  - "${ngram.phrase}" (Count: ${ngram.count})\n`;
        });
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'kannada_analysis_report.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mainTabClass = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
      active ? 'text-neutral-900 border-neutral-900' : 'text-neutral-400 border-transparent hover:text-neutral-700'
    }`;

  const subTabClass = (active: boolean) =>
    `flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
      active ? 'bg-indigo-100 text-indigo-700' : 'text-neutral-500 hover:text-neutral-900'
    }`;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-neutral-200 shadow-sm p-5 sm:p-7 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 pb-5 border-b border-neutral-200 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Analysis Report</h2>
            <p className="text-sm text-neutral-500">A detailed breakdown of your Kannada text.</p>
          </div>
          <button onClick={handleExport} className="w-full sm:w-auto px-4 py-2 bg-white border border-neutral-300 rounded-full hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 text-sm font-semibold text-neutral-700" title="Export Full Report as .txt">
            <ExportIcon className="w-4 h-4 text-neutral-500"/>
            <span>Export Report</span>
          </button>
        </div>

        {/* Main Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-neutral-200 overflow-x-auto">
            <button onClick={() => setMainTab('prosody')} className={mainTabClass(mainTab === 'prosody')}>
              <ProsodyIcon className="w-5 h-5"/>
              <span className="hidden xs:inline">Prosody Analysis</span>
              <span className="xs:hidden">Prosody</span>
            </button>
            <button onClick={() => setMainTab('stats')} className={mainTabClass(mainTab === 'stats')}>
              <StatsIcon className="w-5 h-5"/>
              <span className="hidden xs:inline">Statistical Analysis</span>
              <span className="xs:hidden">Statistics</span>
            </button>
        </div>

      {/* Main Content Area */}
      <div>
        {/* Prosody Analysis Tab */}
        {mainTab === 'prosody' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard label="Total Laghu (ಲ)" value={poemAnalysis.totalLaghu} accent="text-sky-600" />
                    <StatCard label="Total Guru (ಗು)" value={poemAnalysis.totalGuru} accent="text-emerald-600" />
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-neutral-50 rounded-xl border border-neutral-200 gap-2">
                    <h3 className="text-base font-bold text-neutral-900 truncate">Prosody Details</h3>
                    <div className="bg-white p-1 rounded-full flex gap-1 border border-neutral-200 flex-shrink-0">
                        <button
                            onClick={() => setViewMode('pattern')}
                            className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-full transition-all flex items-center gap-1.5 ${viewMode === 'pattern' ? 'bg-indigo-100 text-indigo-700' : 'text-neutral-500 hover:text-neutral-900'}`}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden xs:inline">Pattern</span>
                        </button>
                        <button
                            onClick={() => setViewMode('highlight')}
                            className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-full transition-all flex items-center gap-1.5 ${viewMode === 'highlight' ? 'bg-indigo-100 text-indigo-700' : 'text-neutral-500 hover:text-neutral-900'}`}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            <span className="hidden xs:inline">Highlight</span>
                        </button>
                    </div>
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                    {poemAnalysis.lines.map((line) => (
                    <div key={line.lineNumber} className="bg-neutral-50 p-4 sm:p-5 rounded-xl border border-neutral-200">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-white border border-neutral-200 rounded-lg font-bold text-neutral-500 text-sm">
                            {line.lineNumber}
                          </span>
                          <div className="flex-1 h-px bg-neutral-200"></div>
                        </div>
                        {viewMode === 'pattern' ? (
                            <>
                                <p className="font-kannada text-lg mb-3 text-neutral-800 leading-relaxed">{line.originalText}</p>
                                <div className="bg-white p-3 sm:p-4 rounded-lg border border-neutral-200">
                                  <p className="font-mono text-sm sm:text-base text-indigo-600 tracking-wide whitespace-pre-wrap leading-relaxed">{line.pattern}</p>
                                </div>
                            </>
                        ) : (
                            <div>
                                <div className="font-kannada text-lg sm:text-xl flex flex-wrap items-center gap-2 bg-white p-3 sm:p-4 rounded-lg border border-neutral-200">
                                    {line.words.map((word, wordIndex) => (
                                        <div key={wordIndex} className="flex flex-wrap items-center gap-1 bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-200">
                                            {word.syllables.map((syllable, i) => (
                                                <span key={i} className={`px-2.5 py-1 rounded-lg text-sm sm:text-base font-semibold border ${
                                                    syllable.type === 'L'
                                                      ? 'text-sky-700 bg-sky-50 border-sky-200'
                                                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                                }`}>
                                                    {syllable.text}
                                                </span>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 text-sm">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 rounded-lg border border-sky-200">
                                        <span className="w-3 h-3 rounded-full bg-sky-500 flex-shrink-0"></span>
                                        <span className="font-semibold text-sky-700 whitespace-nowrap">Laghu (ಲ)</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                        <span className="font-semibold text-emerald-700 whitespace-nowrap">Guru (ಗು)</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    ))}
                </div>
            </div>
        )}

        {/* Statistical Analysis Tab */}
        {mainTab === 'stats' && (
             <div className="space-y-6">
                <h3 className="text-lg font-semibold text-neutral-800">Statistical Details</h3>
                {/* Stats Sub-navigation */}
                <div className="flex gap-1 bg-neutral-50 p-1 rounded-full border border-neutral-200">
                    <button onClick={() => setStatsTab('summary')} className={subTabClass(statsTab === 'summary')}>Summary</button>
                    <button onClick={() => setStatsTab('chars')} className={subTabClass(statsTab === 'chars')}>Character Frequency</button>
                    <button onClick={() => setStatsTab('phrases')} className={subTabClass(statsTab === 'phrases')}>Phrases &amp; Words</button>
                </div>

                {/* Stats Content */}
                <div>
                  {statsTab === 'summary' && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StatCard label="Total Words" value={textStats.totalWords} />
                            <StatCard label="Total Sentences" value={textStats.totalSentences} />
                            <StatCard label="Avg. Words / Sentence" value={textStats.averageWordsPerSentence} />
                            <StatCard label="Avg. Word Length" value={`${textStats.averageWordLength} chars`} />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Dispersion (how much values vary from the average)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <StatCard label="Word Length Variance" value={textStats.wordLengthVariance} accent="text-violet-600" />
                              <StatCard label="Word Length Std. Deviation" value={textStats.wordLengthStdDev} accent="text-violet-600" />
                              <StatCard label="Sentence Length Variance" value={textStats.sentenceLengthVariance} accent="text-fuchsia-600" />
                              <StatCard label="Sentence Length Std. Deviation" value={textStats.sentenceLengthStdDev} accent="text-fuchsia-600" />
                          </div>
                          <p className="text-xs text-neutral-400 mt-3">
                            Variance and standard deviation are computed over word length (characters per word) and sentence length (words per sentence) across the whole text.
                          </p>
                        </div>
                      </div>
                  )}

                  {statsTab === 'chars' && (
                    <div>
                      <div className="mb-4">
                        <div className="relative">
                          <input
                            type="text"
                            value={charSearch}
                            onChange={(e) => setCharSearch(e.target.value.slice(0, 1))}
                            placeholder="ಒಂದು ಅಕ್ಷರ ಟೈಪ್ ಮಾಡಿ (e.g. ಅ) to find its exact count…"
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 font-kannada text-lg text-neutral-900 placeholder:text-sm placeholder:font-sans placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                          />
                          {charSearch && (
                            <button
                              onClick={() => setCharSearch('')}
                              aria-label="Clear search"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {charSearch.trim() && (
                        <div className="mb-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50 text-center">
                          {filteredCharacterFrequency.length > 0 ? (
                            <p className="text-neutral-700">
                              <span className="font-kannada text-2xl align-middle mr-2">{charSearch}</span>
                              appears <span className="text-2xl font-bold text-indigo-600 mx-1">{filteredCharacterFrequency[0].count}</span>
                              {filteredCharacterFrequency[0].count === 1 ? 'time' : 'times'} in this text.
                            </p>
                          ) : (
                            <p className="text-neutral-500">
                              <span className="font-kannada text-2xl align-middle mr-2">{charSearch}</span>
                              does not appear in this text (count: 0).
                            </p>
                          )}
                        </div>
                      )}

                      <div className="bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden">
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-neutral-500 uppercase bg-white sticky top-0 z-10 border-b border-neutral-200">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Character</th>
                                        <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Count</th>
                                        <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Frequency Bar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200">
                                    {filteredCharacterFrequency.map(({character, count}) => {
                                        const maxCount = Math.max(...textStats.characterFrequency.map(c => c.count));
                                        const percentage = (count / maxCount) * 100;
                                        return (
                                            <tr key={character} className="hover:bg-white transition-colors">
                                                <td className="px-6 py-3 font-kannada text-xl text-neutral-900 font-semibold">{character}</td>
                                                <td className="px-6 py-3">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 font-mono">
                                                        {count}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 bg-neutral-200 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-neutral-400 font-mono w-12 text-right">
                                                            {percentage.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {statsTab === 'phrases' && (
                    <div>
                      <div className="mb-4 relative">
                        <input
                          type="text"
                          value={phraseSearch}
                          onChange={(e) => setPhraseSearch(e.target.value)}
                          placeholder="ಒಂದು ಪದ ಅಥವಾ ಪದಗುಚ್ಛ ಟೈಪ್ ಮಾಡಿ… search words or phrases"
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 font-kannada text-lg text-neutral-900 placeholder:text-sm placeholder:font-sans placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                        />
                        {phraseSearch && (
                          <button
                            onClick={() => setPhraseSearch('')}
                            aria-label="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="bg-neutral-50 rounded-xl border border-neutral-200 max-h-96 overflow-y-auto custom-scrollbar p-5 space-y-6">
                          {filteredNGramEntries.length > 0 ? (
                              filteredNGramEntries.map(([n, ngrams]) => {
                                  const subTitle = n === '1' ? 'Word Frequency' : `Top ${n}-Word Phrases`;
                                  return (
                                      <div key={n} className="space-y-3">
                                          <h5 className="text-sm font-bold text-neutral-700 uppercase tracking-wide">{subTitle}</h5>
                                          <ul className="space-y-2">
                                              {ngrams.map((ngram, index) => {
                                                  const maxCount = Math.max(...ngrams.map(g => g.count));
                                                  const percentage = (ngram.count / maxCount) * 100;
                                                  return (
                                                      <li key={index} className="flex items-center justify-between gap-4 bg-white border border-neutral-200 p-3 rounded-lg">
                                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                                              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-500">
                                                                  {index + 1}
                                                              </span>
                                                              <span className="font-kannada text-base text-neutral-800 truncate font-medium">
                                                                  "{ngram.phrase}"
                                                              </span>
                                                          </div>
                                                          <div className="flex items-center gap-3 flex-shrink-0">
                                                              <div className="hidden sm:block w-24 bg-neutral-200 rounded-full h-2 overflow-hidden">
                                                                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                                              </div>
                                                              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm border border-indigo-200">
                                                                  ×{ngram.count}
                                                              </span>
                                                          </div>
                                                      </li>
                                                  );
                                              })}
                                          </ul>
                                      </div>
                                  );
                              })
                          ) : (
                              <div className="flex flex-col items-center justify-center p-8 text-center">
                                  <svg className="w-14 h-14 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <p className="text-neutral-500 text-sm">
                                    {phraseSearch.trim() ? `No words or phrases matching "${phraseSearch}".` : 'Not enough text to determine common phrases.'}
                                  </p>
                              </div>
                          )}
                      </div>
                    </div>
                  )}

                </div>
            </div>
        )}
      </div>
    </div>

    {/* Disclaimer about accuracy - Below results */}
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-amber-700 mb-1">Analysis Accuracy Notice</h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            This analysis may have approximately <span className="font-semibold text-amber-700">1% discrepancy</span> due to tokenization variations in Kannada text processing. For detailed information about Kannada text tokenization, please refer to our{' '}
            <a
              href="/Kannada_Text_Tokenization_Research_Paper.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-500 underline font-semibold transition-colors break-words"
            >
              paper
            </a>.
          </p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ResultsDisplay;
