// Basic Stop Words List
const stopWords = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "aren't",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can't",
  "cannot",
  "could",
  "couldn't",
  "did",
  "didn't",
  "do",
  "does",
  "doesn't",
  "doing",
  "don't",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "hadn't",
  "has",
  "hasn't",
  "have",
  "haven't",
  "having",
  "he",
  "he'd",
  "he'll",
  "he's",
  "her",
  "here",
  "here's",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "how's",
  "i",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "if",
  "in",
  "into",
  "is",
  "isn't",
  "it",
  "it's",
  "its",
  "itself",
  "let's",
  "me",
  "more",
  "most",
  "mustn't",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "shan't",
  "she",
  "she'd",
  "she'll",
  "she's",
  "should",
  "shouldn't",
  "so",
  "some",
  "such",
  "than",
  "that",
  "that's",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "there's",
  "these",
  "they",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "wasn't",
  "we",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "were",
  "weren't",
  "what",
  "what's",
  "when",
  "when's",
  "where",
  "where's",
  "which",
  "while",
  "who",
  "who's",
  "whom",
  "why",
  "why's",
  "with",
  "won't",
  "would",
  "wouldn't",
  "you",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "your",
  "yours",
  "yourself",
  "yourselves",
]);

/**
 * Tokenizes a string: lowercases, removes punctuation, splits by space, removes stop words.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter((word) => word.length > 0 && !stopWords.has(word)); // Remove empty strings and stop words
}

/**
 * Creates a frequency map (word -> count) from tokens.
 * @param {string[]} tokens
 * @returns {Map<string, number>}
 */
function getExampleFrequency(tokens) {
  const map = new Map();
  for (const t of tokens) {
    map.set(t, (map.get(t) || 0) + 1);
  }
  return map;
}

/**
 * Calculates Cosine Similarity between two strings.
 * Result is between 0 and 1.
 * @param {string} text1
 * @param {string} text2
 * @returns {number}
 */
export function calculatesimilarity(text1, text2) {
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  // If one or both consist only of stop words or are empty, handle edge cases
  if (tokens1.length === 0 && tokens2.length === 0) return 1; // Both empty - match
  if (tokens1.length === 0 || tokens2.length === 0) return 0; // One empty - no match

  const vec1 = getExampleFrequency(tokens1);
  const vec2 = getExampleFrequency(tokens2);

  const uniqueWords = new Set([...vec1.keys(), ...vec2.keys()]);

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (const word of uniqueWords) {
    const val1 = vec1.get(word) || 0;
    const val2 = vec2.get(word) || 0;

    dotProduct += val1 * val2;
    mag1 += val1 * val1;
    mag2 += val2 * val2;
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  if (mag1 === 0 || mag2 === 0) return 0;

  return dotProduct / (mag1 * mag2);
}

/**
 * Evaluates a descriptive answer against a sample answer.
 * @param {string} candidateAnswer
 * @param {string} sampleAnswer
 * @param {number} maxMarks
 * @returns {number} Score awarded
 */
export function evaluateDescriptiveAnswer(
  candidateAnswer,
  sampleAnswer,
  maxMarks
) {
  if (!sampleAnswer) return 0; // Or maxMarks if manual grading? Assuming auto-grade needs sample.
  if (!candidateAnswer) return 0;

  const similarity = calculatesimilarity(candidateAnswer, sampleAnswer);

  // Logic to determine score based on similarity
  // This can be tuned. For example:
  // > 0.8 => 100%
  // > 0.6 => 80%
  // > 0.4 => 50%
  // > 0.2 => 20%
  // else 0

  // Or linear scaling:
  let score = similarity * maxMarks;

  // Enhance logic: boost exact key matches?
  // For now, let's stick to strict linear cosine mapping, possibly with a slight ceiling boost
  // e.g. if similarity > 0.85, give full marks.

  if (similarity > 0.85) {
    score = maxMarks;
  } else {
    score = Math.round(score * 10) / 10; // Round to 1 decimal place
  }

  return score;
}
