import React, { useState } from 'react';
import { Syllable } from '../types';
import AiComparison from './AiComparison';
import ChatPage from './ChatPage';

interface AiAnalysisPageProps {
  poemText: string;
  localSyllables: Syllable[];
  hasAnalysis: boolean;
  onGoToInput: () => void;
}

type AiTab = 'compare' | 'chat';

const AiAnalysisPage: React.FC<AiAnalysisPageProps> = ({ poemText, localSyllables, hasAnalysis, onGoToInput }) => {
  const [aiTab, setAiTab] = useState<AiTab>('compare');

  const tabClass = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-colors ${
      active ? 'bg-indigo-100 text-indigo-700' : 'text-neutral-500 hover:text-neutral-900'
    }`;

  return (
    <div className="animate-fade-in">
      {/* Sub-navigation between the two AI tools */}
      <div className="flex gap-1 p-1 bg-white rounded-full border border-neutral-200 shadow-sm mb-6 max-w-md mx-auto">
        <button onClick={() => setAiTab('compare')} className={tabClass(aiTab === 'compare')}>
          Compare with AI
        </button>
        <button onClick={() => setAiTab('chat')} className={tabClass(aiTab === 'chat')}>
          Chat with AI
        </button>
      </div>

      {/* Both tabs stay mounted (hidden via CSS) so the comparison result and
          chat history survive switching tabs, or leaving and returning to this page. */}
      <div className={aiTab === 'compare' ? '' : 'hidden'}>
        {hasAnalysis ? (
          <AiComparison poemText={poemText} localSyllables={localSyllables} />
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-12 text-center">
            <svg className="w-14 h-14 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-neutral-500 mb-6">Analyze some text first to compare it with the AI.</p>
            <button
              onClick={onGoToInput}
              className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-700 transition-all"
            >
              Go to Analyze
            </button>
          </div>
        )}
      </div>

      <div className={aiTab === 'chat' ? '' : 'hidden'}>
        <ChatPage poemText={poemText} />
      </div>
    </div>
  );
};

export default AiAnalysisPage;
