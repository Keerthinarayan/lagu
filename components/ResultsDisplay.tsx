
import React from 'react';
import { PoemAnalysis, ViewMode } from '../types';
import ExportIcon from './icons/ExportIcon';

interface ResultsDisplayProps {
  result: PoemAnalysis;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, viewMode, setViewMode }) => {

  const handleExport = () => {
    let report = `LaghuGuru Analysis Report\n`;
    report += `=========================\n\n`;

    result.lines.forEach(line => {
      report += `Line ${line.lineNumber}: ${line.originalText}\n`;
      report += `Pattern: ${line.pattern}\n\n`;
    });

    report += `--- Summary ---\n`;
    report += `Total Laghu (ಲ): ${result.totalLaghu}\n`;
    report += `Total Guru (ಗು): ${result.totalGuru}\n`;
    
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'laghuguru_analysis.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-600">
        <h2 className="text-2xl font-bold text-sky-400 mb-4 sm:mb-0">Analysis Results</h2>
        <div className="flex items-center space-x-2">
            <div className="bg-gray-700 p-1 rounded-lg flex space-x-1">
                <button 
                    onClick={() => setViewMode('pattern')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'pattern' ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                    Pattern
                </button>
                <button 
                    onClick={() => setViewMode('highlight')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'highlight' ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                    Highlight
                </button>
            </div>
            <button onClick={handleExport} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors" title="Export as .txt">
                <ExportIcon className="w-5 h-5 text-gray-300"/>
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-center">
          <div className="bg-blue-900/50 p-4 rounded-lg border border-blue-700">
              <p className="text-3xl font-bold text-blue-300">{result.totalLaghu}</p>
              <p className="text-sm text-blue-400">Total Laghu (ಲ)</p>
          </div>
          <div className="bg-red-900/50 p-4 rounded-lg border border-red-700">
              <p className="text-3xl font-bold text-red-300">{result.totalGuru}</p>
              <p className="text-sm text-red-400">Total Guru (ಗು)</p>
          </div>
      </div>

      <div className="space-y-6">
        {result.lines.map((line) => (
          <div key={line.lineNumber} className="bg-gray-900/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Line {line.lineNumber}</p>
            {viewMode === 'pattern' ? (
                <>
                    <p className="font-kannada text-xl mb-2">{line.originalText}</p>
                    <p className="font-mono text-lg text-cyan-300 tracking-widest">{line.pattern}</p>
                </>
            ) : (
                <div className="font-kannada text-2xl flex flex-wrap items-center">
                    {line.syllables.map((syllable, i) => (
                        <span key={i} className={`p-1 rounded-md ${
                            syllable.type === 'L' ? 'text-blue-400 bg-blue-900/30' : 'text-red-400 bg-red-900/30'
                        }`}>
                            {syllable.text}
                        </span>
                    ))}
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;
