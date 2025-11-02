import { PoemAnalysis, LineAnalysis, Syllable, SyllableType } from '../types';

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
    // Regex to capture a Kannada syllable:
    // - (?:${KANNADA_CONSONANTS}(?:${KANNADA_VIRAMA}${KANNADA_CONSONANTS})*): One or more consonants, possibly forming a cluster.
    // - ${KANNADA_VOWEL_SIGNS}?: An optional vowel sign. (Handles consonants with inherent 'a' vowel)
    // - ${KANNADA_ANUSVARA_VISARGA}?: An optional anusvara or visarga.
    // - | ${KANNADA_INDEPENDENT_VOWELS}${KANNADA_ANUSVARA_VISARGA}?: OR an independent vowel, with optional modifiers.
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
    // Rule 1: Contains a long vowel (independent or sign).
    const longVowelRegex = new RegExp(`(${LONG_VOWEL_SIGNS}|${LONG_INDEPENDENT_VOWELS})`);
    if (longVowelRegex.test(syllable)) {
        return true;
    }

    // Rule 2: Ends with anusvara (ಂ) or visarga (ಃ).
    const modifierRegex = new RegExp(`${KANNADA_ANUSVARA_VISARGA}`);
    if (modifierRegex.test(syllable)) {
        return true;
    }

    // Rule 3: A short vowel syllable followed by a consonant cluster (ಒತ್ತಕ್ಷರ).
    const shortVowelRegex = new RegExp(`(${SHORT_VOWEL_SIGNS}|${SHORT_INDEPENDENT_VOWELS})`);
    
    // A syllable has an inherent short vowel if it's not an independent vowel and contains no explicit vowel sign.
    const hasExplicitVowel = new RegExp(`(${KANNADA_VOWEL_SIGNS}|${KANNADA_INDEPENDENT_VOWELS})`).test(syllable);
    const hasVirama = syllable.includes(KANNADA_VIRAMA); // A character like 'ಕ್' is not a syllable with an inherent vowel.
    const inherentShortVowel = !hasExplicitVowel && !hasVirama;

    if (shortVowelRegex.test(syllable) || inherentShortVowel) {
        // Check if the next syllable is a consonant cluster (i.e., contains a virama).
        if (nextSyllable && nextSyllable.includes(KANNADA_VIRAMA)) {
            return true;
        }
    }

    return false;
};

/**
 * Analyzes a full poem text, line by line.
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
        let pattern = '';
        
        for (let i = 0; i < rawSyllables.length; i++) {
            const currentRawSyllable = rawSyllables[i];
            const nextRawSyllable = rawSyllables[i + 1];
            
            const type: SyllableType = isGuru(currentRawSyllable, nextRawSyllable) ? 'G' : 'L';
            
            syllables.push({ text: currentRawSyllable, type });
            pattern += type + ' ';
            
            if (type === 'L') {
                totalLaghu++;
            } else {
                totalGuru++;
            }
        }
        
        return {
            lineNumber: index + 1,
            originalText,
            syllables,
            pattern: pattern.trim(),
        };
    });

    return {
        lines: analyzedLines,
        totalLaghu,
        totalGuru,
    };
};
