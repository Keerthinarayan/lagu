export type SyllableType = 'L' | 'G'; // Laghu or Guru

export interface Syllable {
  text: string;
  type: SyllableType;
}

export interface Word {
  syllables: Syllable[];
  wordText: string;
}

export interface LineAnalysis {
  lineNumber: number;
  originalText: string;
  syllables: Syllable[];
  words: Word[];
  pattern: string;
}

export interface PoemAnalysis {
  lines: LineAnalysis[];
  totalLaghu: number;
  totalGuru: number;
}

export type ViewMode = 'pattern' | 'highlight';

// New types for statistical analysis
export interface NGram {
  phrase: string;
  count: number;
}

export interface TextStatsAnalysis {
  totalWords: number;
  totalSentences: number;
  averageWordsPerSentence: number;
  averageWordLength: number;
  characterFrequency: { character: string; count: number }[];
  nGramFrequencies: {
    [n: number]: NGram[];
  };
}
