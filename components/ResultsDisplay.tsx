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

const StatCard: React.FC<{ label: string; value: number | string; colorClass: string; gradient?: string; icon?: React.ReactNode }> = ({ label, value, colorClass, gradient, icon }) => (
    <div className={`relative bg-gradient-to-br ${gradient || 'from-slate-800/80 to-slate-900/80'} p-4 sm:p-5 rounded-xl border ${colorClass} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group`}>
        <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-full blur-2xl -mr-10 sm:-mr-12 -mt-10 sm:-mt-12 group-hover:bg-white/10 transition-all"></div>
        <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-slate-400 mb-1 uppercase tracking-wide">{label}</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">{value}</p>
                </div>
                {icon && <div className="text-slate-400/40 group-hover:text-slate-300/60 transition-colors hidden sm:block">{icon}</div>}
            </div>
        </div>
    </div>
);

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ poemAnalysis, textStats, viewMode, setViewMode }) => {
  const [mainTab, setMainTab] = useState<MainTab>('prosody');
  const [statsTab, setStatsTab] = useState<StatsTab>('summary');


  const handleExport = () => {
    let report = `Akshara Analysis Report\n`;
    report += `=========================\n\n`;

    report += `--- Prosody Analysis ---\n`;
    report += `Total Laghu (ಲ): ${poemAnalysis.totalLaghu}\n`;
    report += `Total Guru (ಗು): ${poemAnalysis.totalGuru}\n\n`;
    poemAnalysis.lines.forEach(line => {
      report += `Line ${line.lineNumber}: ${line.originalText}\n`;
      // For multi-line patterns, ensure they are formatted correctly in the text file
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
  
  return (
    <div className="mt-6 sm:mt-8 space-y-4">
      <div className="bg-slate-800/50 border border-slate-700 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 pb-4 border-b border-slate-600 gap-3">
          <div>
               <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Analysis Report</h2>
               <p className="text-sm sm:text-base text-slate-400">A detailed breakdown of your Kannada text.</p>
          </div>
          <button onClick={handleExport} className="w-full sm:w-auto px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center space-x-2 text-xs sm:text-sm font-semibold" title="Export Full Report as .txt">
              <ExportIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300"/>
              <span>Export Report</span>
          </button>
        </div>

        {/* Main Tab Navigation */}
        <div className="mb-4 sm:mb-6 flex space-x-1 sm:space-x-2 border-b border-slate-700 overflow-x-auto">
            <button
              onClick={() => setMainTab('prosody')}
              className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${mainTab === 'prosody' ? 'text-amber-400 border-amber-400' : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              <ProsodyIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
              <span className="hidden xs:inline">Prosody Analysis</span>
              <span className="xs:hidden">Prosody</span>
            </button>
            <button
               onClick={() => setMainTab('stats')}
               className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${mainTab === 'stats' ? 'text-amber-400 border-amber-400' : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              <StatsIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
              <span className="hidden xs:inline">Statistical Analysis</span>
              <span className="xs:hidden">Statistics</span>
            </button>
        </div>

      {/* Main Content Area */}
      <div>
        {/* Prosody Analysis Tab */}
        {mainTab === 'prosody' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <StatCard 
                      label="Total Laghu (ಲ)" 
                      value={poemAnalysis.totalLaghu} 
                      colorClass="border-blue-400/50" 
                      gradient="from-blue-900/30 via-slate-800/80 to-slate-900/80"
                      icon={
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      }
                    />
                    <StatCard 
                      label="Total Guru (ಗು)" 
                      value={poemAnalysis.totalGuru} 
                      colorClass="border-green-400/50"
                      gradient="from-green-900/30 via-slate-800/80 to-slate-900/80"
                      icon={
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        </svg>
                      }
                    />
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-slate-900/60 to-slate-800/60 rounded-xl border border-slate-700/50 backdrop-blur-sm gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg flex items-center justify-center border border-amber-500/30 flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-200 truncate">Prosody Details</h3>
                    </div>
                    <div className="bg-slate-900/60 p-1 sm:p-1.5 rounded-lg flex space-x-1 border border-slate-700/50 shadow-inner flex-shrink-0">
                        <button 
                            onClick={() => setViewMode('pattern')}
                            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-md transition-all duration-300 flex items-center gap-1 sm:gap-2 ${viewMode === 'pattern' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105' : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'}`}>
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden xs:inline">Pattern</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('highlight')}
                            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-md transition-all duration-300 flex items-center gap-1 sm:gap-2 ${viewMode === 'highlight' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105' : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'}`}>
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            <span className="hidden xs:inline">Highlight</span>
                        </button>
                    </div>
                </div>
                <div className="space-y-3 sm:space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                    {poemAnalysis.lines.map((line) => (
                    <div key={line.lineNumber} className="relative bg-gradient-to-br from-slate-900/70 to-slate-800/70 p-4 sm:p-5 md:p-6 rounded-xl border border-slate-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-slate-600/70 hover:scale-[1.01] group/line overflow-hidden">
                        {/* Decorative corner accent */}
                        <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full"></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/40 rounded-lg font-bold text-amber-300 text-xs sm:text-sm">
                              {line.lineNumber}
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-slate-600 via-slate-500 to-transparent"></div>
                          </div>
                          {viewMode === 'pattern' ? (
                              <>
                                  <p className="font-kannada text-base sm:text-lg md:text-xl mb-3 sm:mb-4 text-slate-100 leading-relaxed">{line.originalText}</p>
                                  <div className="bg-gradient-to-br from-slate-950/80 to-slate-900/80 p-3 sm:p-4 rounded-lg border border-slate-700/50 shadow-inner">
                                    <p className="font-mono text-sm sm:text-base text-amber-300 tracking-wide sm:tracking-widest whitespace-pre-wrap leading-relaxed">{line.pattern}</p>
                                  </div>
                              </>
                          ) : (
                              <div>
                                  <div className="font-kannada text-lg sm:text-xl md:text-2xl flex flex-wrap items-center gap-2 sm:gap-3 bg-gradient-to-br from-slate-950/80 to-slate-900/80 p-3 sm:p-4 rounded-lg border border-slate-700/50 shadow-inner">
                                      {line.words.map((word, wordIndex) => (
                                          <div key={wordIndex} className="flex flex-wrap items-center gap-0.5 sm:gap-1 bg-slate-800/40 px-1.5 sm:px-2 py-1 rounded-lg border border-slate-700/30">
                                              {word.syllables.map((syllable, i) => (
                                                  <span key={i} className={`px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 hover:scale-110 ${
                                                      syllable.type === 'L' 
                                                        ? 'text-blue-200 bg-gradient-to-br from-blue-600/40 to-blue-700/40 border border-blue-500/50 shadow-lg shadow-blue-500/20' 
                                                        : 'text-green-200 bg-gradient-to-br from-green-600/40 to-green-700/40 border border-green-500/50 shadow-lg shadow-green-500/20'
                                                  }`}>
                                                      {syllable.text}
                                                  </span>
                                              ))}
                                          </div>
                                      ))}
                                  </div>
                                  <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
                                      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-blue-900/30 rounded-lg border border-blue-500/30">
                                          <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-blue-300 shadow-lg shadow-blue-500/50 flex-shrink-0"></span>
                                          <span className="font-semibold text-blue-300 whitespace-nowrap">Laghu (ಲ)</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-green-900/30 rounded-lg border border-green-500/30">
                                          <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-green-300 shadow-lg shadow-green-500/50 flex-shrink-0"></span>
                                          <span className="font-semibold text-green-300 whitespace-nowrap">Guru (ಗು)</span>
                                      </div>
                                  </div>
                              </div>
                          )}
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        )}

        {/* Statistical Analysis Tab */}
        {mainTab === 'stats' && (
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-slate-300">Statistical Details</h3>
                </div>
                {/* Stats Sub-navigation */}
                <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg">
                    <button onClick={() => setStatsTab('summary')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${statsTab === 'summary' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Summary</button>
                    <button onClick={() => setStatsTab('chars')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${statsTab === 'chars' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Character Frequency</button>
                    <button onClick={() => setStatsTab('phrases')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${statsTab === 'phrases' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Phrases & Words</button>
                </div>
                
                {/* Stats Content */}
                <div>
                  {statsTab === 'summary' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <StatCard 
                            label="Total Words" 
                            value={textStats.totalWords} 
                            colorClass="border-orange-400/50" 
                            gradient="from-orange-900/30 via-slate-800/80 to-slate-900/80"
                            icon={
                              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                              </svg>
                            }
                          />
                          <StatCard 
                            label="Total Sentences" 
                            value={textStats.totalSentences} 
                            colorClass="border-rose-400/50"
                            gradient="from-rose-900/30 via-slate-800/80 to-slate-900/80"
                            icon={
                              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                              </svg>
                            }
                          />
                          <StatCard 
                            label="Avg. Words / Sentence" 
                            value={textStats.averageWordsPerSentence} 
                            colorClass="border-purple-400/50"
                            gradient="from-purple-900/30 via-slate-800/80 to-slate-900/80"
                            icon={
                              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                              </svg>
                            }
                          />
                          <StatCard 
                            label="Avg. Word Length" 
                            value={`${textStats.averageWordLength} chars`} 
                            colorClass="border-cyan-400/50"
                            gradient="from-cyan-900/30 via-slate-800/80 to-slate-900/80"
                            icon={
                              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
                              </svg>
                            }
                          />
                      </div>
                  )}

                  {statsTab === 'chars' && (
                    <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/60 rounded-xl border border-slate-700/50 backdrop-blur-sm overflow-hidden shadow-xl">
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-300 uppercase bg-gradient-to-r from-slate-800 to-slate-700 sticky top-0 z-10 shadow-lg">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-semibold tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                                </svg>
                                                Character
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 font-semibold tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                                </svg>
                                                Count
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Frequency Bar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {textStats.characterFrequency.map(({character, count}, index) => {
                                        const maxCount = Math.max(...textStats.characterFrequency.map(c => c.count));
                                        const percentage = (count / maxCount) * 100;
                                        return (
                                            <tr key={character} className="hover:bg-slate-700/30 transition-colors group">
                                                <td className="px-6 py-3 font-kannada text-xl text-slate-200 font-semibold">{character}</td>
                                                <td className="px-6 py-3">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 font-mono">
                                                        {count}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-slate-400 font-mono w-12 text-right group-hover:text-amber-400 transition-colors">
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
                  )}
                  
                  {statsTab === 'phrases' && (
                      <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/60 rounded-xl border border-slate-700/50 backdrop-blur-sm max-h-96 overflow-y-auto custom-scrollbar p-5 space-y-6 shadow-xl">
                          {Object.keys(textStats.nGramFrequencies).length > 0 ? (
                              Object.entries(textStats.nGramFrequencies).map(([n, ngrams], sectionIndex) => {
                                  const subTitle = n === '1' ? 'Word Frequency' : `Top ${n}-Word Phrases`;
                                  const gradients = [
                                      'from-blue-500/20 to-cyan-500/20',
                                      'from-purple-500/20 to-pink-500/20',
                                      'from-amber-500/20 to-orange-500/20'
                                  ];
                                  const borderColors = [
                                      'border-blue-500/30',
                                      'border-purple-500/30',
                                      'border-amber-500/30'
                                  ];
                                  const iconColors = [
                                      'text-blue-400',
                                      'text-purple-400',
                                      'text-amber-400'
                                  ];
                                  return (
                                      <div key={n} className="space-y-3">
                                          <div className="flex items-center gap-2 mb-3">
                                              <svg className={`w-5 h-5 ${iconColors[sectionIndex % 3]}`} fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                              </svg>
                                              <h5 className="text-base font-bold text-slate-200 uppercase tracking-wide">{subTitle}</h5>
                                          </div>
                                          <ul className="space-y-2">
                                              {ngrams.map((ngram, index) => {
                                                  const maxCount = Math.max(...ngrams.map(n => n.count));
                                                  const percentage = (ngram.count / maxCount) * 100;
                                                  return (
                                                      <li key={index} className={`flex items-center justify-between gap-4 bg-gradient-to-r ${gradients[sectionIndex % 3]} border ${borderColors[sectionIndex % 3]} p-4 rounded-lg hover:scale-[1.01] transition-transform duration-200 group shadow-md`}>
                                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                                              <span className={`flex-shrink-0 w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-xs font-bold ${iconColors[sectionIndex % 3]}`}>
                                                                  {index + 1}
                                                              </span>
                                                              <span className="font-kannada text-base text-slate-100 truncate font-medium group-hover:text-white transition-colors">
                                                                  "{ngram.phrase}"
                                                              </span>
                                                          </div>
                                                          <div className="flex items-center gap-3 flex-shrink-0">
                                                              <div className="hidden sm:block w-24 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                                                                  <div 
                                                                      className={`h-full bg-gradient-to-r ${gradients[sectionIndex % 3].replace('/20', '')} rounded-full transition-all duration-500`}
                                                                      style={{ width: `${percentage}%` }}
                                                                  ></div>
                                                              </div>
                                                              <span className={`font-mono font-extrabold ${iconColors[sectionIndex % 3]} bg-slate-800/70 px-3 py-1.5 rounded-full text-sm border ${borderColors[sectionIndex % 3]}`}>
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
                                  <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <p className="text-slate-400 text-sm">Not enough text to determine common phrases.</p>
                              </div>
                          )}
                      </div>
                  )}

                </div>
            </div>
        )}
      </div>
    </div>
    
    {/* Disclaimer about accuracy - Below results */}
    <div className="bg-gradient-to-r from-amber-900/20 via-orange-900/20 to-slate-900/30 border border-amber-500/30 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-lg flex items-center justify-center border border-amber-500/40">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-amber-300 mb-1">⚠️ Analysis Accuracy Notice</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            This analysis may have approximately <span className="font-semibold text-amber-400">1% discrepancy</span> due to tokenization variations in Kannada text processing. For detailed information about Kannada text tokenization, please download the{' '}
            <a 
              href="https://raw.githubusercontent.com/Keerthinarayan/lagu/main/public/Kannada_Text_Tokenization_Paper.pdf
" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline font-semibold transition-colors break-words"
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
