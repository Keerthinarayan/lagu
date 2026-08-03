import { PoemAnalysis, LineAnalysis, Syllable, SyllableType, TextStatsAnalysis, NGram } from '../types';

// Unicode constants for Kannada characters
const KANNADA_CONSONANTS = '[\u0C95-\u0CB9]';
// CORRECTED: The previous range was missing many vowel signs (e.g., ೆ, ೊ, ೈ, ೌ).
// This now includes all matras from ಾ to ೌ.
const KANNADA_VOWEL_SIGNS = '[\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCC]';
const KANNADA_ANUSVARA_VISARGA = '[\u0C82\u0C83]';
const KANNADA_VIRAMA = '\u0CCD';
const KANNADA_INDEPENDENT_VOWELS = '[\u0C85-\u0C94]';

// Vowel classifications
// CORRECTED: Replaced \u0CCB (long O sign) with \u0CCA (short o sign).
const SHORT_VOWEL_SIGNS = '[\u0CBF\u0CC1\u0CC3\u0CC6\u0CCA]'; // ಿ, ು, ೃ, ೆ, ೊ signs
// CORRECTED: Replaced \u0CCA (short o sign) with \u0CCB (long O sign). Now correctly includes all long vowel signs and diphthongs.
const LONG_VOWEL_SIGNS = '[\u0CBE\u0CC0\u0CC2\u0CC4\u0CC7\u0CC8\u0CCB\u0CCC]'; // ಾ, ೀ, ೂ, ೄ, ೇ, ೈ, ೋ, ೌ signs
const SHORT_INDEPENDENT_VOWELS = '[\u0C85\u0C87\u0C89\u0C8B\u0C8E\u0C92]'; // ಅ, ಇ, ಉ, ಋ, ಎ, ಒ
const LONG_INDEPENDENT_VOWELS = '[\u0C86\u0C88\u0C8A\u0C8C\u0C8F\u0C90\u0C93\u0C94]'; // ಆ, ಈ, ಊ, ೠ, ಏ, ಐ, ಓ, ಔ

/**
 * Syllabifies a line of Kannada text.
 * A syllable is a consonant (or cluster) plus a vowel sign, or an independent vowel.
 * @param line - The line of text to syllabify.
 * @returns An array of strings, where each string is a syllable.
 */
const syllabify = (line: string): string[] => {
    const syllableRegex = new RegExp(
        `(?:${KANNADA_CONSONANTS}(?:${KANNADA_VIRAMA}${KANNADA_CONSONANTS})*)${KANNADA_VOWEL_SIGNS}?${KANNADA_ANUSVARA_VISARGA}?|${KANNADA_INDEPENDENT_VOWELS}${KANNADA_ANUSVARA_VISARGA}?`,
        'g'
    );
    return line.match(syllableRegex) || [];
};

/**
 * Determines if a syllable is Guru based on its content and the next syllable.
 * @param syllable - The current syllable string.
 * @param nextSyllable - The next syllable string (can be undefined).
 * @returns true if the syllable is Guru, false otherwise.
 */
const isGuru = (syllable: string, nextSyllable?: string): boolean => {
    const longVowelRegex = new RegExp(`(${LONG_VOWEL_SIGNS}|${LONG_INDEPENDENT_VOWELS})`);
    if (longVowelRegex.test(syllable)) return true;

    const modifierRegex = new RegExp(`${KANNADA_ANUSVARA_VISARGA}`);
    if (modifierRegex.test(syllable)) return true;

    const shortVowelRegex = new RegExp(`(${SHORT_VOWEL_SIGNS}|${SHORT_INDEPENDENT_VOWELS})`);
    const hasExplicitVowel = new RegExp(`(${KANNADA_VOWEL_SIGNS}|${KANNADA_INDEPENDENT_VOWELS})`).test(syllable);
    const hasVirama = syllable.includes(KANNADA_VIRAMA);
    const inherentShortVowel = !hasExplicitVowel && !hasVirama;

    if (shortVowelRegex.test(syllable) || inherentShortVowel) {
        if (nextSyllable && nextSyllable.includes(KANNADA_VIRAMA)) {
            return true;
        }
    }

    return false;
};

/**
 * Analyzes a full poem text for Laghu/Guru, line by line.
 * @param text - The full Kannada poem as a string.
 * @returns A PoemAnalysis object with detailed breakdown.
 */
export const analyzePoem = (text: string): PoemAnalysis => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    let totalLaghu = 0;
    let totalGuru = 0;

    const analyzedLines: LineAnalysis[] = lines.map((line, index) => {
        const originalText = line.trim();
        const rawSyllables = syllabify(originalText);
        
        const syllables: Syllable[] = [];
        
        // First pass: determine syllable types and update totals
        for (let i = 0; i < rawSyllables.length; i++) {
            const currentRawSyllable = rawSyllables[i];
            const nextRawSyllable = rawSyllables[i + 1];
            const type: SyllableType = isGuru(currentRawSyllable, nextRawSyllable) ? 'G' : 'L';
            
            syllables.push({ text: currentRawSyllable, type });
            
            if (type === 'L') totalLaghu++;
            else totalGuru++;
        }
        
        // Group syllables by words (based on spaces in original text)
        const wordStrings = originalText.split(/\s+/);
        const words: { syllables: Syllable[]; wordText: string }[] = [];
        let syllableIndex = 0;
        
        for (const wordText of wordStrings) {
            const wordSyllables: Syllable[] = [];
            let currentWordLength = 0;
            
            // Collect syllables that belong to this word
            while (syllableIndex < syllables.length && currentWordLength < wordText.length) {
                wordSyllables.push(syllables[syllableIndex]);
                currentWordLength += syllables[syllableIndex].text.length;
                syllableIndex++;
            }
            
            if (wordSyllables.length > 0) {
                words.push({ syllables: wordSyllables, wordText });
            }
        }
        
        // Second pass: build the pattern string with correct spacing and newlines
        let pattern = '';
        let searchIndex = 0;
        for (let i = 0; i < syllables.length; i++) {
            const currentSyllable = syllables[i];
            pattern += currentSyllable.type;
            
            // Find the end of the current syllable in the original text
            const currentSyllableIndex = originalText.indexOf(currentSyllable.text, searchIndex);
            const endOfCurrentSyllable = currentSyllableIndex + currentSyllable.text.length;
            
            let interstitial = '';
            if (i < syllables.length - 1) {
                // Find what's between this syllable and the next one
                const nextSyllable = syllables[i+1];
                const nextSyllableIndex = originalText.indexOf(nextSyllable.text, endOfCurrentSyllable);
                interstitial = originalText.substring(endOfCurrentSyllable, nextSyllableIndex);
            } else {
                // It's the last syllable, so check from its end to the end of the line
                interstitial = originalText.substring(endOfCurrentSyllable);
            }
            
            // If the text between syllables contains a full stop, add a newline
            if (/[।॥.]+/.test(interstitial)) {
                pattern += '\n';
            } else {
                pattern += ' ';
            }
            
            searchIndex = endOfCurrentSyllable;
        }

        return {
            lineNumber: index + 1,
            originalText,
            syllables,
            words,
            pattern: pattern.trim(),
        };
    });

    return { lines: analyzedLines, totalLaghu, totalGuru };
};

// Sentence-terminating punctuation: Kannada danda/double-danda (।॥), their ASCII
// stand-ins (| and ||, matched by the `+` quantifier below), and ./?/!.
const SENTENCE_TERMINATOR_REGEX = /[।॥.!?|]+/g;
// Punctuation to strip out when tokenizing words (superset of the sentence terminators).
const WORD_PUNCTUATION_REGEX = /[।॥.,!?;:()\[\]{}"'“”‘’|]/g;

/**
 * Performs statistical analysis on a given Kannada text.
 * @param text - The full Kannada text as a string.
 * @returns A TextStatsAnalysis object.
 */
export const analyzeTextStats = (text: string): TextStatsAnalysis => {
    // 1. Tokenize sentences and words
    const sentences = text.split(SENTENCE_TERMINATOR_REGEX).filter(s => s.trim().length > 0);
    const words = text.replace(WORD_PUNCTUATION_REGEX, ' ').split(/\s+/).filter(w => w.length > 0);
    
    if (words.length === 0) {
        return {
            totalWords: 0,
            totalSentences: 0,
            averageWordsPerSentence: 0,
            averageWordLength: 0,
            wordLengthVariance: 0,
            wordLengthStdDev: 0,
            sentenceLengthVariance: 0,
            sentenceLengthStdDev: 0,
            characterFrequency: [],
            wordLengthFrequencies: {},
            nGramFrequencies: {},
        };
    }

    // 2. Calculate basic stats
    const totalWords = words.length;
    const totalSentences = sentences.length > 0 ? sentences.length : 1; // Avoid division by zero
    const averageWordsPerSentence = parseFloat((totalWords / totalSentences).toFixed(2));
    const totalWordLength = words.reduce((acc, word) => acc + word.length, 0);
    const averageWordLength = parseFloat((totalWordLength / totalWords).toFixed(2));

    // Population variance/std dev of word length (character count per word).
    const rawAverageWordLength = totalWordLength / totalWords;
    const wordLengthVarianceRaw = words.reduce((acc, word) => acc + (word.length - rawAverageWordLength) ** 2, 0) / totalWords;
    const wordLengthVariance = parseFloat(wordLengthVarianceRaw.toFixed(2));
    const wordLengthStdDev = parseFloat(Math.sqrt(wordLengthVarianceRaw).toFixed(2));

    // Population variance/std dev of sentence length (word count per sentence).
    const sentenceWordCounts = sentences.map(
        s => s.replace(WORD_PUNCTUATION_REGEX, ' ').split(/\s+/).filter(w => w.length > 0).length
    ).filter(count => count > 0);
    const rawAverageWordsPerSentence = sentenceWordCounts.length > 0
        ? sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length
        : 0;
    const sentenceLengthVarianceRaw = sentenceWordCounts.length > 0
        ? sentenceWordCounts.reduce((acc, count) => acc + (count - rawAverageWordsPerSentence) ** 2, 0) / sentenceWordCounts.length
        : 0;
    const sentenceLengthVariance = parseFloat(sentenceLengthVarianceRaw.toFixed(2));
    const sentenceLengthStdDev = parseFloat(Math.sqrt(sentenceLengthVarianceRaw).toFixed(2));

    // 3. Count frequency of every Kannada character
    const charMap = new Map<string, number>();
    const kannadaCharRegex = /[\u0C80-\u0CFF]/g;
    const allKannadaChars = text.match(kannadaCharRegex) || [];
    
    allKannadaChars.forEach(char => {
        charMap.set(char, (charMap.get(char) || 0) + 1);
    });

    const characterFrequency = Array.from(charMap.entries())
        .map(([character, count]) => ({ character, count }))
        .sort((a, b) => a.character.localeCompare(b.character, 'kn')); // Sort alphabetically

    // 4. Word frequency grouped by syllable (akshara) count: 1-letter words, 2-letter words, etc.
    const wordCounts = new Map<string, number>();
    words.forEach(word => wordCounts.set(word, (wordCounts.get(word) || 0) + 1));

    const wordsBySyllableLength = new Map<number, Map<string, number>>();
    wordCounts.forEach((count, word) => {
        const syllableCount = syllabify(word).length;
        if (syllableCount === 0) return; // skip words with no recognizable Kannada aksharas
        if (!wordsBySyllableLength.has(syllableCount)) {
            wordsBySyllableLength.set(syllableCount, new Map());
        }
        wordsBySyllableLength.get(syllableCount)!.set(word, count);
    });

    const wordLengthFrequencies: { [syllableCount: number]: NGram[] } = {};
    Array.from(wordsBySyllableLength.keys())
        .sort((a, b) => a - b)
        .forEach(syllableCount => {
            wordLengthFrequencies[syllableCount] = Array.from(wordsBySyllableLength.get(syllableCount)!.entries())
                .sort((a, b) => b[1] - a[1]) // Sort by count descending
                .map(([phrase, count]) => ({ phrase, count }));
        });

    // 5. Calculate N-gram (multi-word phrase) frequencies, from 2-word to 15-word phrases
    const nGramFrequencies: { [n: number]: NGram[] } = {};
    for (let n = 2; n <= 15; n++) {
        if (words.length < n) break;

        const ngrams = new Map<string, number>();
        for (let i = 0; i <= words.length - n; i++) {
            const phrase = words.slice(i, i + n).join(' ');
            ngrams.set(phrase, (ngrams.get(phrase) || 0) + 1);
        }

        const sortedNgrams = Array.from(ngrams.entries())
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .slice(0, 10) // Get top items
            .map(([phrase, count]) => ({ phrase, count }));

        if (sortedNgrams.length > 0) {
            nGramFrequencies[n] = sortedNgrams;
        }
    }

    return {
        totalWords,
        totalSentences,
        averageWordsPerSentence,
        averageWordLength,
        wordLengthVariance,
        wordLengthStdDev,
        sentenceLengthVariance,
        sentenceLengthStdDev,
        characterFrequency,
        wordLengthFrequencies,
        nGramFrequencies,
    };
};