
export type SyllableType = 'L' | 'G'; // Laghu or Guru

export interface Syllable {
  text: string;
  type: SyllableType;
}

export interface LineAnalysis {
  lineNumber: number;
  originalText: string;
  syllables: Syllable[];
  pattern: string;
}

export interface PoemAnalysis {
  lines: LineAnalysis[];
  totalLaghu: number;
  totalGuru: number;
}

export type ViewMode = 'pattern' | 'highlight';
