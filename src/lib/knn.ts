import { Tweet, KNNParams } from "@/pages/Index";

// Default distance function
function defaultDistance(t1: string, t2: string): number {
  const words1 = new Set(t1.split(/\s+/).filter(w => w.length > 0));
  const words2 = new Set(t2.split(/\s+/).filter(w => w.length > 0));
  
  const union = new Set([...words1, ...words2]);
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  
  if (union.size === 0) return 1.0;
  return (union.size - intersection.size) / union.size;
}

// Jaccard distance
function jaccardDistance(t1: string, t2: string): number {
  const words1 = new Set(t1.split(/\s+/).filter(w => w.length > 0));
  const words2 = new Set(t2.split(/\s+/).filter(w => w.length > 0));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 1.0;
  return 1 - (intersection.size / union.size);
}

// Levenshtein distance (normalized)
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 0 : matrix[len1][len2] / maxLen;
}

// Cosine distance
function cosineDistance(t1: string, t2: string): number {
  const words1 = t1.split(/\s+/).filter(w => w.length > 0);
  const words2 = t2.split(/\s+/).filter(w => w.length > 0);
  
  const allWords = [...new Set([...words1, ...words2])];
  const vec1 = allWords.map(w => words1.filter(x => x === w).length);
  const vec2 = allWords.map(w => words2.filter(x => x === w).length);
  
  const dotProduct = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
  
  if (mag1 === 0 || mag2 === 0) return 1.0;
  return 1 - (dotProduct / (mag1 * mag2));
}

function getDistanceFunction(type: string) {
  switch (type) {
    case "jaccard": return jaccardDistance;
    case "levenshtein": return levenshteinDistance;
    case "cosine": return cosineDistance;
    default: return defaultDistance;
  }
}

export function knnClassify(
  tweetText: string,
  trainingData: Tweet[],
  params: KNNParams
): string {
  const distanceFn = getDistanceFunction(params.distanceType);
  
  // Calculate distances to all training tweets
  const distances = trainingData
    .map(tweet => ({
      distance: distanceFn(tweetText, tweet.cleaned || tweet.text),
      label: tweet.label!
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, params.k);

  if (params.voteType === "weighted") {
    // Weighted voting
    const weights = new Map<string, number>();
    
    distances.forEach(({ distance, label }) => {
      const weight = distance === 0 ? 1 : 1 / (distance + 0.0001);
      weights.set(label, (weights.get(label) || 0) + weight);
    });
    
    let maxWeight = -1;
    let predictedLabel = "neutral";
    
    weights.forEach((weight, label) => {
      if (weight > maxWeight) {
        maxWeight = weight;
        predictedLabel = label;
      }
    });
    
    return predictedLabel;
  } else {
    // Majority voting
    const votes = new Map<string, number>();
    
    distances.forEach(({ label }) => {
      votes.set(label, (votes.get(label) || 0) + 1);
    });
    
    let maxVotes = -1;
    let predictedLabel = "neutral";
    
    votes.forEach((count, label) => {
      if (count > maxVotes) {
        maxVotes = count;
        predictedLabel = label;
      }
    });
    
    return predictedLabel;
  }
}
