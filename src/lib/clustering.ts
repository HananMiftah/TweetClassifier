import { Tweet } from "@/pages/Index";

// Calculate distance between two tweets based on common words
export function tweetDistance(tweet1: string, tweet2: string): number {
  const words1 = new Set(tweet1.toLowerCase().split(/\s+/).filter(w => w.length > 0));
  const words2 = new Set(tweet2.toLowerCase().split(/\s+/).filter(w => w.length > 0));
  
  const commonWords = new Set([...words1].filter(w => words2.has(w)));
  const totalWords = words1.size + words2.size;
  
  if (totalWords === 0) return 1;
  
  return (totalWords - commonWords.size) / totalWords;
}

// Create distance matrix for all tweets
export function createDistanceMatrix(tweets: Tweet[]): number[][] {
  const n = tweets.length;
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = tweetDistance(tweets[i].cleaned, tweets[j].cleaned);
      matrix[i][j] = dist;
      matrix[j][i] = dist;
    }
  }
  
  return matrix;
}

// Convert square distance matrix to condensed form (upper triangular)
export function squareToCondensed(matrix: number[][]): number[] {
  const n = matrix.length;
  const condensed: number[] = [];
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      condensed.push(matrix[i][j]);
    }
  }
  
  return condensed;
}

// Hierarchical clustering using specified linkage method
export interface ClusterNode {
  left?: number;
  right?: number;
  distance: number;
  count: number;
}

export type LinkageMethod = 'average' | 'complete' | 'ward';

export function hierarchicalClustering(
  distanceMatrix: number[][],
  method: LinkageMethod = 'average'
): ClusterNode[] {
  const n = distanceMatrix.length;
  const clusters: ClusterNode[] = [];
  const active = new Set(Array.from({ length: n }, (_, i) => i));
  const clusterSizes = Array(n).fill(1);
  
  // Distance matrix (mutable)
  const distances = distanceMatrix.map(row => [...row]);
  
  while (active.size > 1) {
    // Find minimum distance
    let minDist = Infinity;
    let minI = -1;
    let minJ = -1;
    
    const activeArray = Array.from(active);
    for (let i = 0; i < activeArray.length; i++) {
      for (let j = i + 1; j < activeArray.length; j++) {
        const ci = activeArray[i];
        const cj = activeArray[j];
        if (distances[ci][cj] < minDist) {
          minDist = distances[ci][cj];
          minI = ci;
          minJ = cj;
        }
      }
    }
    
    if (minI === -1 || minJ === -1) break;
    
    // Merge clusters
    const newCluster: ClusterNode = {
      left: minI,
      right: minJ,
      distance: minDist,
      count: clusterSizes[minI] + clusterSizes[minJ]
    };
    
    clusters.push(newCluster);
    const newIndex = n + clusters.length - 1;
    
    // Update distances
    active.delete(minJ);
    
    // Calculate distances from new cluster to all others
    for (const k of active) {
      if (k === minI) continue;
      
      let newDist: number;
      if (method === 'average') {
        // Average linkage
        newDist = (distances[minI][k] * clusterSizes[minI] + 
                   distances[minJ][k] * clusterSizes[minJ]) / 
                  (clusterSizes[minI] + clusterSizes[minJ]);
      } else if (method === 'complete') {
        // Complete linkage (maximum)
        newDist = Math.max(distances[minI][k], distances[minJ][k]);
      } else {
        // Ward - simplified (would need proper implementation with variance)
        newDist = Math.sqrt(
          ((clusterSizes[minI] + clusterSizes[k]) * distances[minI][k] * distances[minI][k] +
           (clusterSizes[minJ] + clusterSizes[k]) * distances[minJ][k] * distances[minJ][k] -
           clusterSizes[k] * distances[minI][minJ] * distances[minI][minJ]) /
          (clusterSizes[minI] + clusterSizes[minJ] + clusterSizes[k])
        );
      }
      
      distances[minI][k] = newDist;
      distances[k][minI] = newDist;
    }
    
    clusterSizes[minI] = clusterSizes[minI] + clusterSizes[minJ];
  }
  
  return clusters;
}

// Cut dendrogram to get K clusters
export function formClusters(linkage: ClusterNode[], k: number, n: number): number[] {
  const assignments = Array(n).fill(0).map((_, i) => i);
  
  // Take top k-1 merges to form k clusters
  const merges = linkage.slice(-(k - 1));
  
  for (let i = 0; i < merges.length; i++) {
    const merge = merges[i];
    const clusterId = n + linkage.indexOf(merge);
    
    if (merge.left !== undefined && merge.left < n) {
      assignments[merge.left] = clusterId;
    }
    if (merge.right !== undefined && merge.right < n) {
      assignments[merge.right] = clusterId;
    }
  }
  
  // Renumber clusters to 0, 1, 2, ...
  const uniqueClusters = [...new Set(assignments)];
  const mapping = new Map(uniqueClusters.map((c, i) => [c, i]));
  
  return assignments.map(a => mapping.get(a) || 0);
}

// Evaluation metrics
export function calculateAccuracy(predicted: number[], actual: string[]): number {
  if (predicted.length !== actual.length) return 0;
  
  // Map cluster IDs to most common label in that cluster
  const clusterLabels = new Map<number, Map<string, number>>();
  
  for (let i = 0; i < predicted.length; i++) {
    const cluster = predicted[i];
    const label = actual[i];
    
    if (!clusterLabels.has(cluster)) {
      clusterLabels.set(cluster, new Map());
    }
    const labelCounts = clusterLabels.get(cluster)!;
    labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
  }
  
  // Find dominant label for each cluster
  const clusterToLabel = new Map<number, string>();
  for (const [cluster, labelCounts] of clusterLabels) {
    let maxCount = 0;
    let maxLabel = '';
    for (const [label, count] of labelCounts) {
      if (count > maxCount) {
        maxCount = count;
        maxLabel = label;
      }
    }
    clusterToLabel.set(cluster, maxLabel);
  }
  
  // Calculate accuracy
  let correct = 0;
  for (let i = 0; i < predicted.length; i++) {
    const predictedLabel = clusterToLabel.get(predicted[i]);
    if (predictedLabel === actual[i]) {
      correct++;
    }
  }
  
  return correct / predicted.length;
}

export function createConfusionMatrix(
  predicted: number[],
  actual: string[]
): { matrix: number[][]; labels: string[] } {
  const labels = [...new Set(actual)].sort();
  const n = labels.length;
  const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
  
  // Map cluster IDs to most common label
  const clusterLabels = new Map<number, Map<string, number>>();
  for (let i = 0; i < predicted.length; i++) {
    const cluster = predicted[i];
    const label = actual[i];
    if (!clusterLabels.has(cluster)) {
      clusterLabels.set(cluster, new Map());
    }
    const labelCounts = clusterLabels.get(cluster)!;
    labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
  }
  
  const clusterToLabel = new Map<number, string>();
  for (const [cluster, labelCounts] of clusterLabels) {
    let maxCount = 0;
    let maxLabel = '';
    for (const [label, count] of labelCounts) {
      if (count > maxCount) {
        maxCount = count;
        maxLabel = label;
      }
    }
    clusterToLabel.set(cluster, maxLabel);
  }
  
  // Fill confusion matrix
  for (let i = 0; i < predicted.length; i++) {
    const predLabel = clusterToLabel.get(predicted[i]);
    const trueLabel = actual[i];
    const predIdx = labels.indexOf(predLabel || '');
    const trueIdx = labels.indexOf(trueLabel);
    if (predIdx >= 0 && trueIdx >= 0) {
      matrix[trueIdx][predIdx]++;
    }
  }
  
  return { matrix, labels };
}

// Rand Index
export function calculateRandIndex(clusters1: number[], clusters2: string[]): number {
  const n = clusters1.length;
  let a = 0; // pairs in same cluster in both
  let b = 0; // pairs in different clusters in both
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sameC1 = clusters1[i] === clusters1[j];
      const sameC2 = clusters2[i] === clusters2[j];
      
      if (sameC1 && sameC2) a++;
      else if (!sameC1 && !sameC2) b++;
    }
  }
  
  const total = (n * (n - 1)) / 2;
  return (a + b) / total;
}
