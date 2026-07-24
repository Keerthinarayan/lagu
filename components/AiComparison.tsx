import React, { useState, useCallback, useMemo } from 'react';
import { Syllable } from '../types';
import { analyzeWithAI, isAiAvailable } from '../services/geminiAnalyzer';
import { analyzeWithGroq, isGroqAvailable } from '../services/groqAnalyzer';
import { analyzeWithOpenRouter, isOpenRouterAvailable } from '../services/openRouterAnalyzer';

interface AiComparisonProps {
  poemText: string;
  localSyllables: Syllable[];
}

interface ProviderConfig {
  id: string;
  name: string;
  available: boolean;
  analyze: (text: string) => Promise<Syllable[]>;
  envVar: string;
  signupUrl: string;
  signupLabel: string;
  accent: {
    border: string;
    text: string;
    chipBg: string;
    chipBorder: string;
    chipText: string;
  };
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    available: isAiAvailable(),
    analyze: analyzeWithAI,
    envVar: 'GEMINI_API_KEY',
    signupUrl: 'https://aistudio.google.com/apikey',
    signupLabel: 'aistudio.google.com/apikey',
    accent: { border: 'border-indigo-200', text: 'text-indigo-700', chipBg: 'bg-indigo-50', chipBorder: 'border-indigo-200', chipText: 'text-indigo-700' },
  },
  {
    id: 'groq',
    name: 'Groq (Llama 3.3)',
    available: isGroqAvailable(),
    analyze: analyzeWithGroq,
    envVar: 'GROQ_API_KEY',
    signupUrl: 'https://console.groq.com/keys',
    signupLabel: 'console.groq.com/keys',
    accent: { border: 'border-orange-200', text: 'text-orange-700', chipBg: 'bg-orange-50', chipBorder: 'border-orange-200', chipText: 'text-orange-700' },
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Nemotron 3 Ultra)',
    available: isOpenRouterAvailable(),
    analyze: analyzeWithOpenRouter,
    envVar: 'OPENROUTER_API_KEY',
    signupUrl: 'https://openrouter.ai/keys',
    signupLabel: 'openrouter.ai/keys',
    accent: { border: 'border-violet-200', text: 'text-violet-700', chipBg: 'bg-violet-50', chipBorder: 'border-violet-200', chipText: 'text-violet-700' },
  },
];

interface ProviderState {
  syllables: Syllable[] | null;
  isLoading: boolean;
  error: string | null;
}

interface Comparison {
  aligned: number;
  typeMatches: number;
  agreement: number;
  segmentationMatch: number;
  aiMismatchFlags: boolean[];
  mismatches: { text: string; localType: 'L' | 'G'; aiType: 'L' | 'G' }[];
  totalLocal: number;
  totalAi: number;
  segmentationDiffers: boolean;
}

/** Diffs an AI provider's syllable output against the rule-based engine's output. */
const computeComparison = (localSyllables: Syllable[], aiSyllables: Syllable[]): Comparison => {
  const len = Math.min(localSyllables.length, aiSyllables.length);
  let aligned = 0;
  let typeMatches = 0;
  const aiMismatchFlags: boolean[] = aiSyllables.map(() => false);
  const mismatches: Comparison['mismatches'] = [];

  for (let i = 0; i < len; i++) {
    if (localSyllables[i].text === aiSyllables[i].text) {
      aligned++;
      if (localSyllables[i].type === aiSyllables[i].type) {
        typeMatches++;
      } else {
        aiMismatchFlags[i] = true;
        mismatches.push({ text: aiSyllables[i].text, localType: localSyllables[i].type, aiType: aiSyllables[i].type });
      }
    }
  }

  const agreement = aligned > 0 ? Math.round((typeMatches / aligned) * 100) : 0;
  const segmentationMatch = localSyllables.length > 0 ? Math.round((aligned / localSyllables.length) * 100) : 0;
  const totalLocal = localSyllables.length;
  const totalAi = aiSyllables.length;

  return { aligned, typeMatches, agreement, segmentationMatch, aiMismatchFlags, mismatches, totalLocal, totalAi, segmentationDiffers: totalLocal !== totalAi };
};

const countBy = (syllables: Syllable[], type: 'L' | 'G') => syllables.filter((s) => s.type === type).length;

// AI comparison sends this text to 3 separate APIs and asks for a JSON object
// listing every syllable back. For a long document (a multi-page upload) that
// blows past Groq's request-size limit (HTTP 413) and Gemini's output-token
// limit (silently returns nothing). Comparison is meant as a representative
// spot-check, not full-document processing, so we cap the sample size here.
const MAX_COMPARE_CHARS = 2000;

/** Truncates the rule-based syllable list to roughly the same character span sent to the AI, so both sides describe the same text. */
const truncateSyllablesToChars = (syllables: Syllable[], maxChars: number): Syllable[] => {
  let charCount = 0;
  const result: Syllable[] = [];
  for (const s of syllables) {
    charCount += s.text.length;
    if (charCount > maxChars) break;
    result.push(s);
  }
  return result;
};

/** A single syllable chip, colored by Laghu/Guru with an optional mismatch flag. */
const SyllableChip: React.FC<{ syllable: Syllable; mismatch?: boolean }> = ({ syllable, mismatch }) => {
  const isGuru = syllable.type === 'G';
  const base = isGuru ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-sky-50 border-sky-200 text-sky-700';
  const flag = mismatch ? 'ring-2 ring-amber-400 ring-offset-1' : '';
  return (
    <span
      title={isGuru ? 'Guru (ಗುರು)' : 'Laghu (ಲಘು)'}
      className={`inline-flex items-center justify-center px-2.5 py-1.5 m-0.5 rounded-lg border font-kannada text-base ${base} ${flag}`}
    >
      {syllable.text}
    </span>
  );
};

const AiComparison: React.FC<AiComparisonProps> = ({ poemText, localSyllables }) => {
  const [results, setResults] = useState<Record<string, ProviderState>>({});

  const availableProviders = useMemo(() => PROVIDERS.filter((p) => p.available), []);
  const unavailableProviders = useMemo(() => PROVIDERS.filter((p) => !p.available), []);
  const anyLoading = availableProviders.some((p) => results[p.id]?.isLoading);

  const isTruncated = poemText.length > MAX_COMPARE_CHARS;
  const comparisonText = isTruncated ? poemText.slice(0, MAX_COMPARE_CHARS) : poemText;
  // The reference panel and comparison stats use only the syllables covering
  // the same text the AI actually saw, so both sides are comparing like-for-like.
  const referenceSyllables = isTruncated ? truncateSyllablesToChars(localSyllables, MAX_COMPARE_CHARS) : localSyllables;

  const runProvider = useCallback(async (provider: ProviderConfig) => {
    setResults((prev) => ({ ...prev, [provider.id]: { syllables: null, isLoading: true, error: null } }));
    try {
      const syllables = await provider.analyze(comparisonText);
      setResults((prev) => ({ ...prev, [provider.id]: { syllables, isLoading: false, error: null } }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred.';
      setResults((prev) => ({ ...prev, [provider.id]: { syllables: null, isLoading: false, error: message } }));
    }
  }, [comparisonText]);

  const runAll = useCallback(() => {
    availableProviders.forEach((p) => runProvider(p));
  }, [availableProviders, runProvider]);

  const localCounts = { L: countBy(referenceSyllables, 'L'), G: countBy(referenceSyllables, 'G') };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Compare with AI</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Get a second (and third, and fourth) opinion from AI models and see where each agrees with the rule-based engine.
          </p>
        </div>
        {availableProviders.length > 0 && (
          <button
            onClick={runAll}
            disabled={anyLoading}
            className="shrink-0 px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {anyLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Comparing…
              </>
            ) : (
              Object.keys(results).length > 0 ? `Re-run All (${availableProviders.length})` : `Compare with All AI (${availableProviders.length})`
            )}
          </button>
        )}
      </div>

      {availableProviders.length === 0 && (
        <div className="mt-5 p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-600 leading-relaxed">
          <p className="font-semibold text-neutral-900 mb-2">AI comparison needs at least one free API key</p>
          <ul className="space-y-1.5">
            {PROVIDERS.map((p) => (
              <li key={p.id}>
                <span className="font-medium text-neutral-800">{p.name}:</span> get a free key at{' '}
                <span className="font-mono text-indigo-600">{p.signupLabel}</span> and set{' '}
                <code className="bg-white px-1.5 py-0.5 rounded text-indigo-600 border border-neutral-200">{p.envVar}</code> in{' '}
                <code className="bg-white px-1.5 py-0.5 rounded text-indigo-600 border border-neutral-200">.env.local</code>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-neutral-400">Restart the dev server after adding a key.</p>
        </div>
      )}

      {availableProviders.length > 0 && unavailableProviders.length > 0 && (
        <div className="mt-5 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-500">
          Not configured yet: {unavailableProviders.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ', '}
              <span className="font-medium text-neutral-700">{p.name}</span> (
              <code className="text-indigo-600">{p.envVar}</code> — free key at{' '}
              <span className="font-mono text-indigo-600">{p.signupLabel}</span>)
            </span>
          ))}
        </div>
      )}

      {isTruncated && (
        <div className="mt-5 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700">
          Comparing only the first {MAX_COMPARE_CHARS.toLocaleString()} characters ({referenceSyllables.length} syllables) of your text. Sending a full multi-page document to every AI provider would exceed their free-tier request/response limits — this is a representative sample, not the complete text.
        </div>
      )}

      {/* Rule-based reference panel */}
      <div className="mt-6 bg-neutral-50 rounded-xl p-4 border border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center justify-between">
          <span>Rule-based engine (reference)</span>
          <span className="text-xs font-normal text-neutral-400">{localCounts.L} L · {localCounts.G} G</span>
        </h3>
        <div className="flex flex-wrap">
          {referenceSyllables.map((s, i) => <SyllableChip key={i} syllable={s} />)}
        </div>
      </div>

      {/* One card per AI provider */}
      {availableProviders.length > 0 && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {availableProviders.map((provider) => {
            const state = results[provider.id];
            const comparison = state?.syllables ? computeComparison(referenceSyllables, state.syllables) : null;

            return (
              <div key={provider.id} className={`bg-neutral-50 rounded-xl p-4 border ${provider.accent.border}`}>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className={`text-sm font-semibold ${provider.accent.text}`}>{provider.name}</h3>
                  <div className="flex items-center gap-2">
                    {state?.syllables && (
                      <span className="text-xs font-normal text-neutral-400">
                        {countBy(state.syllables, 'L')} L · {countBy(state.syllables, 'G')} G
                      </span>
                    )}
                    <button
                      onClick={() => runProvider(provider)}
                      disabled={state?.isLoading}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                    >
                      {state?.isLoading ? '…' : state?.syllables || state?.error ? 'Retry' : 'Run'}
                    </button>
                  </div>
                </div>

                {!state && (
                  <p className="text-xs text-neutral-400">Not run yet.</p>
                )}

                {state?.isLoading && (
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <svg className="animate-spin h-4 w-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Asking {provider.name}…
                  </div>
                )}

                {state?.error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                    {state.error}
                  </div>
                )}

                {state?.syllables && comparison && (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${provider.accent.chipBg} ${provider.accent.chipText} border ${provider.accent.chipBorder}`}>
                        {comparison.agreement}% agreement
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                        {comparison.segmentationMatch}% segmentation
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {comparison.mismatches.length} disagreements
                      </span>
                      {comparison.segmentationDiffers && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                          {comparison.totalLocal} / {comparison.totalAi} syllables
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap">
                      {state.syllables.map((s, i) => (
                        <SyllableChip key={i} syllable={s} mismatch={comparison.aiMismatchFlags[i]} />
                      ))}
                    </div>

                    {comparison.mismatches.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {comparison.mismatches.map((m, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-white border border-amber-200 rounded-md px-2 py-0.5 text-xs">
                            <span className="font-kannada text-sm text-neutral-800">{m.text}</span>
                            <span className={`px-1 rounded font-semibold ${m.localType === 'G' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>{m.localType}</span>
                            <span className="text-neutral-300">→</span>
                            <span className={`px-1 rounded font-semibold ${m.aiType === 'G' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>{m.aiType}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {availableProviders.length > 0 && (
        <p className="text-xs text-neutral-400 mt-5 text-center">
          AI results are a second opinion and may occasionally differ in how the text is segmented. The rule-based engine remains the primary analysis.
        </p>
      )}
    </div>
  );
};

export default AiComparison;
