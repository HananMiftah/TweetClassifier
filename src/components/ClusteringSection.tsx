import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tweet } from "@/pages/Index";
import { 
  createDistanceMatrix, 
  hierarchicalClustering, 
  formClusters,
  calculateAccuracy,
  createConfusionMatrix,
  calculateRandIndex,
  LinkageMethod,
  ClusterNode
} from "@/lib/clustering";
import { Network, BarChart3, GitBranch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DendrogramVisualization from "./DendrogramVisualization";

interface ClusteringSectionProps {
  tweets: Tweet[];
}

const ClusteringSection = ({ tweets }: ClusteringSectionProps) => {
  const { toast } = useToast();
  const [clusterCount, setClusterCount] = useState([3]);
  const [method, setMethod] = useState<LinkageMethod>("average");
  const [clusterResults, setClusterResults] = useState<{
    assignments: number[];
    accuracy: number;
    confusionMatrix: { matrix: number[][]; labels: string[] };
    randIndex: number;
    linkage: ClusterNode[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClustering = async () => {
    if (tweets.length < 2) {
      toast({
        title: "Not enough data",
        description: "You need at least 2 tweets to perform clustering",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/sentiment/cluster/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tweets,                // full tweets array (with text, cleaned, label)
          k: clusterCount[0],    // number of clusters
          linkage: method,       // 'average' | 'complete' | 'ward'
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "API error");
      }

      const data = await res.json();

      // Backend returns:
      // assignments: number[]
      // accuracy: number | null
      // rand_index: number | null
      // confusion_matrix: { matrix: number[][], labels: string[] }
      // linkage: { left: number | null, right: number | null, distance: number, count: number }[]

      setClusterResults({
        assignments: data.assignments,
        accuracy: data.accuracy ?? 0,
        confusionMatrix: data.confusion_matrix ?? { matrix: [], labels: [] },
        randIndex: data.rand_index ?? 0,
        linkage: data.linkage,
      });

      toast({
        title: "Clustering complete",
        description: `${tweets.length} tweets clustered into ${clusterCount[0]} groups using ${method} linkage`,
      });
    } catch (error) {
      console.error("Clustering error:", error);
      toast({
        title: "Clustering failed",
        description: "An error occurred during clustering",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };
  // const { toast } = useToast();
  // const [clusterCount, setClusterCount] = useState([3]);
  // const [method, setMethod] = useState<LinkageMethod>('average');
  // const [clusterResults, setClusterResults] = useState<{
  //   assignments: number[];
  //   accuracy: number;
  //   confusionMatrix: { matrix: number[][]; labels: string[] };
  //   randIndex: number;
  //   linkage: ClusterNode[];
  // } | null>(null);
  // const [isProcessing, setIsProcessing] = useState(false);

  // const handleClustering = async () => {
  //   if (tweets.length < 2) {
  //     toast({
  //       title: "Not enough data",
  //       description: "You need at least 2 tweets to perform clustering",
  //       variant: "destructive"
  //     });
  //     return;
  //   }

  //   setIsProcessing(true);
    
  //   try {
  //     // Create distance matrix
  //     const distanceMatrix = createDistanceMatrix(tweets);
      
  //     // Perform hierarchical clustering
  //     const linkage = hierarchicalClustering(distanceMatrix, method);
      
  //     // Form K clusters
  //     const assignments = formClusters(linkage, clusterCount[0], tweets.length);
      
  //     // Get actual labels (filter tweets with labels)
  //     const labeledTweets = tweets.filter(t => t.label);
  //     const labeledAssignments = assignments.slice(0, labeledTweets.length);
  //     const actualLabels = labeledTweets.map(t => t.label!);
      
  //     if (labeledTweets.length === 0) {
  //       toast({
  //         title: "No labeled data",
  //         description: "Cannot calculate evaluation metrics without labeled tweets",
  //         variant: "destructive"
  //       });
  //       setClusterResults({ assignments, accuracy: 0, confusionMatrix: { matrix: [], labels: [] }, randIndex: 0, linkage });
  //       setIsProcessing(false);
  //       return;
  //     }
      
  //     // Calculate evaluation metrics
  //     const accuracy = calculateAccuracy(labeledAssignments, actualLabels);
  //     const confusionMatrix = createConfusionMatrix(labeledAssignments, actualLabels);
  //     const randIndex = calculateRandIndex(labeledAssignments, actualLabels);
      
  //     setClusterResults({
  //       assignments,
  //       accuracy,
  //       confusionMatrix,
  //       randIndex,
  //       linkage
  //     });
      
  //     toast({
  //       title: "Clustering complete",
  //       description: `${tweets.length} tweets clustered into ${clusterCount[0]} groups using ${method} linkage`
  //     });
  //   } catch (error) {
  //     console.error("Clustering error:", error);
  //     toast({
  //       title: "Clustering failed",
  //       description: "An error occurred during clustering",
  //       variant: "destructive"
  //     });
  //   }
    
  //   setIsProcessing(false);
  // };

  // const handleClustering = async () => {
  //   if (tweets.length < 2) {
  //     toast({
  //       title: "Not enough data",
  //       description: "You need at least 2 tweets to perform clustering",
  //       variant: "destructive"
  //     });
  //     return;
  //   }
  
  //   setIsProcessing(true);
  
  //   try {
  //     const response = await fetch("http://localhost:8000/api/sentiment/cluster/", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         tweets: tweets.map(t => ({
  //           text: t.text,
  //           label: t.label
  //         })),
  //         k: clusterCount[0]
  //       }),
  //     });
  
  //     const data = await response.json();
  //     console.log("DATA FROM API:", data);
  
      
  //     setClusterResults({
  //       assignments: data.classified ?? [],   // <–– THIS WAS THE PROBLEM
  //       accuracy: data.accuracy || 0,
  //       confusionMatrix: data.confusion_matrix
  //         ? {
  //             matrix: data.confusion_matrix.matrix,
  //             labels: data.confusion_matrix.labels
  //           }
  //         : { matrix: [], labels: [] },
  //       randIndex: data.rand_index || 0,
  //       linkage: data.linkage || []
  //     });
  
  //     toast({
  //       title: "Clustering complete",
  //       description: `${tweets.length} tweets clustered into ${clusterCount[0]} groups`
  //     });
  
  //   } catch (error) {
  //     console.error("Clustering API error:", error);
  //     toast({
  //       title: "API Error",
  //       description: "Failed to connect to the Django clustering API",
  //       variant: "destructive"
  //     });
  //   }
  
  //   setIsProcessing(false);
  // };
  
  // const handleClustering = async () => {
  //   if (tweets.length < 2) {
  //     toast({
  //       title: "Not enough data",
  //       description: "You need at least 2 tweets to perform clustering",
  //       variant: "destructive"
  //     });
  //     return;
  //   }
  
  //   setIsProcessing(true);
  
  //   try {
  //     const response = await fetch("http://localhost:8000/api/sentiment/cluster/", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         tweets: tweets.map(t => ({ cleaned: t.cleaned, label: t.label || null })), 
  //         k: clusterCount[0],
  //         linkage: method
  //       })
  //     });
  
  //     const data = await response.json();
  
  //     if (!response.ok) {
  //       throw new Error(data.error || "Clustering failed");
  //     }
  
  //     // Update state with backend results
  //     setClusterResults({
  //       assignments: data.assignments,
  //       accuracy: data.accuracy,
  //       randIndex: data.rand_index,
  //       linkage: data.linkage,
  //       confusionMatrix: null  // Backend doesn't compute confusion matrix
  //     });
  
  //     toast({
  //       title: "Clustering complete",
  //       description: `${tweets.length} tweets clustered into ${clusterCount[0]} groups using ${method} linkage`
  //     });
  
  //   } catch (error: any) {
  //     console.error("Clustering error:", error);
  //     toast({
  //       title: "Clustering failed",
  //       description: error.message,
  //       variant: "destructive"
  //     });
  //   }
  
  //   setIsProcessing(false);
  // };
  
  
  
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <CardTitle>Hierarchical Clustering</CardTitle>
          </div>
          <CardDescription>
            Group tweets based on word similarity using distance matrix
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Clustering Method</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={method === 'average' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMethod('average')}
                >
                  Average
                </Button>
                <Button
                  variant={method === 'complete' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMethod('complete')}
                >
                  Complete
                </Button>
                <Button
                  variant={method === 'ward' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMethod('ward')}
                >
                  Ward
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {method === 'average' && "Average linkage: distance between clusters is the average of all pairwise distances"}
                {method === 'complete' && "Complete linkage: distance between clusters is the maximum pairwise distance"}
                {method === 'ward' && "Ward linkage: minimizes within-cluster variance (bonus method)"}
              </p>
            </div>

            <div>
              <Label htmlFor="cluster-count" className="text-sm font-medium">
                Number of Clusters: {clusterCount[0]}
              </Label>
              <Slider
                id="cluster-count"
                min={2}
                max={10}
                step={1}
                value={clusterCount}
                onValueChange={setClusterCount}
                className="w-full mt-2"
              />
            </div>

            <Button 
              onClick={handleClustering} 
              disabled={isProcessing || tweets.length < 2}
              className="w-full"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Run Clustering"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {clusterResults && (
        <Tabs defaultValue="dendrogram" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dendrogram">Dendrogram</TabsTrigger>
            <TabsTrigger value="metrics">Evaluation Metrics</TabsTrigger>
            <TabsTrigger value="clusters">Cluster Results</TabsTrigger>
          </TabsList>

          <TabsContent value="dendrogram">
            <Card>
              <CardHeader>
                <CardTitle>Dendrogram Tree</CardTitle>
                <CardDescription>
                  Hierarchical clustering tree visualization using {method} linkage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DendrogramVisualization linkage={clusterResults.linkage} method={method} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle>Evaluation Metrics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                    <p className="text-2xl font-bold text-primary">
                      {(clusterResults.accuracy * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Rand Index</p>
                    <p className="text-2xl font-bold text-accent">
                      {clusterResults.randIndex.toFixed(3)}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Clusters</p>
                    <p className="text-2xl font-bold text-secondary-foreground">
                      {clusterCount[0]}
                    </p>
                  </div>
                </div>

                {clusterResults.confusionMatrix.labels.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Confusion Matrix</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border border-border p-2 bg-muted"></th>
                            {clusterResults.confusionMatrix.labels.map(label => (
                              <th key={label} className="border border-border p-2 bg-muted text-xs">
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {clusterResults.confusionMatrix.matrix.map((row, i) => (
                            <tr key={i}>
                              <td className="border border-border p-2 bg-muted text-xs font-medium">
                                {clusterResults.confusionMatrix.labels[i]}
                              </td>
                              {row.map((val, j) => (
                                <td 
                                  key={j} 
                                  className="border border-border p-2 text-center text-sm"
                                  style={{
                                    backgroundColor: val > 0 ? `hsl(var(--primary) / ${val / Math.max(...row) * 0.3})` : 'transparent'
                                  }}
                                >
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clusters">
            <Card>
              <CardHeader>
                <CardTitle>Cluster Assignments</CardTitle>
                <CardDescription>
                  View how tweets were grouped into {clusterCount[0]} clusters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {tweets.slice(0, 100).map((tweet, idx) => (
                    <div key={tweet.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Badge variant="outline" className="shrink-0">
                        Cluster {clusterResults.assignments[idx]}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{tweet.cleaned}</p>
                        {tweet.label && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Actual: <span className="font-medium">{tweet.label}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {tweets.length > 100 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Showing first 100 of {tweets.length} tweets
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ClusteringSection;
