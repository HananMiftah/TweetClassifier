import { Tweet } from "@/pages/Index";

/**
 * Naive Bayes Classifier for tweet sentiment analysis
 * Uses Laplace smoothing to handle unknown words
 * Implements the bag-of-words model with log probabilities
 */
export class NaiveBayesClassifier {
  private vocab: Set<string> = new Set();
  private classCounts: Map<string, number> = new Map();
  private wordCounts: Map<string, Map<string, number>> = new Map();
  private totalWordsPerClass: Map<string, number> = new Map();
  private totalDocuments: number = 0;

  /**
   * Train the classifier on labeled tweet data
   * @param trainingData - Array of tweets with labels
   */
  train(trainingData: Tweet[]): void {
    // Reset all counters
    this.vocab.clear();
    this.classCounts.clear();
    this.wordCounts.clear();
    this.totalWordsPerClass.clear();
    this.totalDocuments = 0;

    for (const tweet of trainingData) {
      if (!tweet.label) continue;

      const words = this.tokenize(tweet.cleaned || tweet.text);
      const sentiment = tweet.label.toLowerCase().trim();

      // Update class counts
      this.classCounts.set(sentiment, (this.classCounts.get(sentiment) || 0) + 1);
      this.totalDocuments++;

      // Initialize word counts map for this class if needed
      if (!this.wordCounts.has(sentiment)) {
        this.wordCounts.set(sentiment, new Map());
      }
      if (!this.totalWordsPerClass.has(sentiment)) {
        this.totalWordsPerClass.set(sentiment, 0);
      }

      const classWordCounts = this.wordCounts.get(sentiment)!;

      // Count words
      for (const word of words) {
        this.vocab.add(word);
        classWordCounts.set(word, (classWordCounts.get(word) || 0) + 1);
        this.totalWordsPerClass.set(
          sentiment,
          this.totalWordsPerClass.get(sentiment)! + 1
        );
      }
    }
  }

  /**
   * Tokenize tweet text into words
   * @param text - Tweet text to tokenize
   * @returns Array of lowercase words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  /**
   * Calculate log probability P(tweet|sentiment) using Laplace smoothing
   * @param words - Array of words from the tweet
   * @param sentiment - The sentiment class
   * @returns Log probability
   */
  private calculateLikelihood(words: string[], sentiment: string): number {
    let logProb = 0.0;
    const vocabSize = this.vocab.size;
    const classWordCounts = this.wordCounts.get(sentiment) || new Map();
    const totalWords = this.totalWordsPerClass.get(sentiment) || 0;

    for (const word of words) {
      // Laplace smoothing: (count + 1) / (total + vocab_size)
      const wordCount = (classWordCounts.get(word) || 0) + 1;
      const totalWithSmoothing = totalWords + vocabSize;
      const wordProb = wordCount / totalWithSmoothing;

      // Use log to avoid underflow
      logProb += Math.log(wordProb);
    }

    return logProb;
  }

  /**
   * Calculate prior probability P(sentiment)
   * @param sentiment - The sentiment class
   * @returns Log probability
   */
  private calculatePrior(sentiment: string): number {
    const count = this.classCounts.get(sentiment) || 0;
    if (this.totalDocuments === 0) return Math.log(1 / 3); // Equal priors
    return Math.log(count / this.totalDocuments);
  }

  /**
   * Classify a new tweet
   * @param text - Tweet text to classify
   * @returns Predicted sentiment label
   */
  classify(text: string): string {
    const words = this.tokenize(text);
    let bestClass = "neutral";
    let bestScore = -Infinity;

    for (const sentiment of this.classCounts.keys()) {
      // P(sentiment|tweet) ∝ P(tweet|sentiment) * P(sentiment)
      const prior = this.calculatePrior(sentiment);
      const likelihood = this.calculateLikelihood(words, sentiment);
      const posteriorProb = likelihood + prior;

      if (posteriorProb > bestScore) {
        bestScore = posteriorProb;
        bestClass = sentiment;
      }
    }

    return bestClass;
  }

  /**
   * Get probability distribution for all classes
   * @param text - Tweet text to classify
   * @returns Map of sentiment to probability
   */
  getClassProbabilities(text: string): Map<string, number> {
    const words = this.tokenize(text);
    const logProbs = new Map<string, number>();

    // Calculate log probabilities for all classes
    for (const sentiment of this.classCounts.keys()) {
      const prior = this.calculatePrior(sentiment);
      const likelihood = this.calculateLikelihood(words, sentiment);
      logProbs.set(sentiment, likelihood + prior);
    }

    // Convert log probabilities to regular probabilities
    const maxLogProb = Math.max(...Array.from(logProbs.values()));
    const probs = new Map<string, number>();

    for (const [sentiment, logProb] of logProbs.entries()) {
      probs.set(sentiment, Math.exp(logProb - maxLogProb));
    }

    // Normalize
    const total = Array.from(probs.values()).reduce((sum, p) => sum + p, 0);
    for (const [sentiment, prob] of probs.entries()) {
      probs.set(sentiment, prob / total);
    }

    return probs;
  }
}

/**
 * Classify a tweet using Naive Bayes
 * @param tweetText - The tweet text to classify
 * @param trainingData - Labeled training tweets
 * @returns Predicted sentiment label
 */
export function naiveBayesClassify(
  tweetText: string,
  trainingData: Tweet[]
): string {
  const classifier = new NaiveBayesClassifier();
  classifier.train(trainingData);
  return classifier.classify(tweetText);
}
