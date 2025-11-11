import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { KNNParams, Tweet } from "@/pages/Index";
import { knnClassify } from "@/lib/knn";
import { dictionaryClassify } from "@/lib/dictionaryClassify";
import { useToast } from "@/hooks/use-toast";

interface KNNConfigProps {
  knnParams: KNNParams;
  setKnnParams: (params: KNNParams) => void;
  trainingTweets: Tweet[];
  testTweets: Tweet[];
  setTestTweets: (tweets: Tweet[]) => void;
  setTrainingTweets: (tweets: Tweet[]) => void;
  isClassifying: boolean;
  setIsClassifying: (value: boolean) => void;
  classificationMethod: "knn" | "dictionary";
  setClassificationMethod: (method: "knn" | "dictionary") => void;
}

const KNNConfig = ({
  knnParams,
  setKnnParams,
  trainingTweets,
  testTweets,
  setTestTweets,
  setTrainingTweets,
  isClassifying,
  setIsClassifying,
  classificationMethod,
  setClassificationMethod
}: KNNConfigProps) => {
  const { toast } = useToast();

  const handleAutoLabel = async () => {
    const unlabeled = trainingTweets.filter(t => !t.label);
    
    if (unlabeled.length === 0) {
      toast({
        title: "No unlabeled data",
        description: "All training data is already labeled",
      });
      return;
    }

    setIsClassifying(true);
    
    setTimeout(() => {
      const labeled = trainingTweets.map(tweet => {
        if (!tweet.label) {
          return {
            ...tweet,
            label: dictionaryClassify(tweet.cleaned || tweet.text)
          };
        }
        return tweet;
      });
      
      setTrainingTweets(labeled);
      setIsClassifying(false);
      
      toast({
        title: "Auto-labeling complete",
        description: `${unlabeled.length} tweets labeled automatically`,
      });
    }, 500);
  };

  const handleClassify = async () => {
    if (classificationMethod === "knn" && trainingTweets.length === 0) {
      toast({
        title: "No training data",
        description: "Please upload training data first",
        variant: "destructive"
      });
      return;
    }

    if (testTweets.length === 0) {
      toast({
        title: "No test data",
        description: "Please upload test data first",
        variant: "destructive"
      });
      return;
    }

    setIsClassifying(true);
    
    setTimeout(() => {
      const classified = testTweets.map(tweet => {
        const predictedLabel = classificationMethod === "knn"
          ? knnClassify(tweet.cleaned || tweet.text, trainingTweets, knnParams)
          : dictionaryClassify(tweet.cleaned || tweet.text);
        
        return {
          ...tweet,
          predictedLabel
        };
      });
      
      setTestTweets(classified);
      setIsClassifying(false);
      
      toast({
        title: "Classification complete",
        description: `${classified.length} tweets classified successfully`,
      });
    }, 1000);
  };

  const unlabeledCount = trainingTweets.filter(t => !t.label).length;

  return (
    <div className="space-y-6">
      {/* Classification Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Classification Method</CardTitle>
          <CardDescription>
            Choose between KNN or Dictionary-based sentiment classification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="method-select">Method</Label>
            <Select
              value={classificationMethod}
              onValueChange={(value: "knn" | "dictionary") => setClassificationMethod(value)}
            >
              <SelectTrigger id="method-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="knn">K-Nearest Neighbors (KNN)</SelectItem>
                <SelectItem value="dictionary">Dictionary-based Sentiment</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {classificationMethod === "knn" 
                ? "Uses training data to classify based on nearest neighbors"
                : "Uses positive/negative word dictionaries for classification"}
            </p>
          </div>

          {unlabeledCount > 0 && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Auto-label Training Data</p>
                <p className="text-xs text-muted-foreground">
                  {unlabeledCount} unlabeled tweets detected in training data
                </p>
              </div>
              <Button 
                onClick={handleAutoLabel}
                disabled={isClassifying}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isClassifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Labeling...
                  </>
                ) : (
                  "Auto-label with Dictionary"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {classificationMethod === "knn" && (
          <Card>
            <CardHeader>
              <CardTitle>KNN Algorithm Configuration</CardTitle>
              <CardDescription>
                Customize parameters for K-Nearest Neighbors classification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="k-slider">Number of Neighbors (k)</Label>
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                k = {knnParams.k}
              </span>
            </div>
            <Slider
              id="k-slider"
              min={1}
              max={20}
              step={1}
              value={[knnParams.k]}
              onValueChange={([value]) => setKnnParams({ ...knnParams, k: value })}
            />
            <p className="text-xs text-muted-foreground">
              Higher k values smooth predictions but may reduce accuracy
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="vote-type">Vote Type</Label>
            <Select
              value={knnParams.voteType}
              onValueChange={(value: "majority" | "weighted") => 
                setKnnParams({ ...knnParams, voteType: value })
              }
            >
              <SelectTrigger id="vote-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="majority">Majority Vote</SelectItem>
                <SelectItem value="weighted">Weighted Vote (Bonus)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {knnParams.voteType === "majority" 
                ? "Each neighbor has equal vote weight"
                : "Closer neighbors have more influence"}
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="distance-type">Distance Metric</Label>
            <Select
              value={knnParams.distanceType}
              onValueChange={(value: any) => 
                setKnnParams({ ...knnParams, distanceType: value })
              }
            >
              <SelectTrigger id="distance-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Set-based)</SelectItem>
                <SelectItem value="jaccard">Jaccard Distance</SelectItem>
                <SelectItem value="cosine">Cosine Distance (Bonus)</SelectItem>
                <SelectItem value="levenshtein">Levenshtein Distance (Bonus)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the distance metric for comparing tweet similarity
            </p>
          </div>
        </CardContent>
      </Card>
        )}

      <Card>
        <CardHeader>
          <CardTitle>Run Classification</CardTitle>
          <CardDescription>
            Execute KNN algorithm on test data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Training samples:</span>
              <span className="font-mono font-medium">{trainingTweets.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Test samples:</span>
              <span className="font-mono font-medium">{testTweets.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Algorithm:</span>
              <span className="font-medium">
                {classificationMethod === "knn" ? "K-Nearest Neighbors" : "Dictionary-based"}
              </span>
            </div>
          </div>

          <Button 
            onClick={handleClassify} 
            disabled={isClassifying || (classificationMethod === "knn" && trainingTweets.length === 0) || testTweets.length === 0}
            className="w-full"
            size="lg"
          >
            {isClassifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Classifying...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Classification
              </>
            )}
          </Button>

          {classificationMethod === "knn" && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">Current Configuration:</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• k = {knnParams.k} neighbors</li>
                <li>• Vote: {knnParams.voteType}</li>
                <li>• Distance: {knnParams.distanceType}</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default KNNConfig;
