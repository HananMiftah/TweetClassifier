import positiveWordsFile from "@/assets/positive-words.txt?raw";
import negativeWordsFile from "@/assets/negative-words.txt?raw";

// Load and parse the word lists
const positiveWords = new Set(
  positiveWordsFile.toLowerCase().split(/[,\s]+/).filter(w => w.length > 0)
);
const negativeWords = new Set(
  negativeWordsFile.toLowerCase().split(/[,\s]+/).filter(w => w.length > 0)
);

export function dictionaryClassify(text: string): string {
  const words = text.toLowerCase().split(/\s+/);
  
  const positiveCount = words.filter(w => positiveWords.has(w)).length;
  const negativeCount = words.filter(w => negativeWords.has(w)).length;
  
  if (positiveCount > negativeCount) {
    return "positive";
  } else if (negativeCount > positiveCount) {
    return "negative";
  } else {
    return "neutral";
  }
}
