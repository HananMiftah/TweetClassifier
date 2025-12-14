import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { KNNParams, NaiveBayesParams, Tweet } from "@/pages/Index";
import { knnClassify } from "@/lib/knn";
import { dictionaryClassify } from "@/lib/dictionaryClassify";
import { naiveBayesClassify } from "@/lib/naiveBayes";
import { useToast } from "@/hooks/use-toast";

interface KNNConfigProps {
  knnParams: KNNParams;
  setKnnParams: (params: KNNParams) => void;
  naiveBayesParams: NaiveBayesParams;
  setNaiveBayesParams: (params: NaiveBayesParams) => void;
  trainingTweets: Tweet[];
  testTweets: Tweet[];
  setTestTweets: (tweets: Tweet[]) => void;
  setTrainingTweets: (tweets: Tweet[]) => void;
  isClassifying: boolean;
  setIsClassifying: (value: boolean) => void;
  classificationMethod: "knn" | "dictionary" | "naiveBayes";
  setClassificationMethod: (
    method: "knn" | "dictionary" | "naiveBayes"
  ) => void;
}

const KNNConfig = ({
  knnParams,
  setKnnParams,
  naiveBayesParams,
  setNaiveBayesParams,
  trainingTweets,
  testTweets,
  setTestTweets,
  setTrainingTweets,
  isClassifying,
  setIsClassifying,
  classificationMethod,
  setClassificationMethod,
}: KNNConfigProps) => {
  const { toast } = useToast();
  const handleAutoLabel = async () => {
    const unlabeled = trainingTweets.filter((t) => !t.label);

    if (unlabeled.length === 0) {
      toast({
        title: "No unlabeled data",
        description: "All training data is already labeled",
      });
      return;
    }

    setIsClassifying(true);

    try {
      const res = await fetch(
        "https://backend-apii-o46a.onrender.com/api/sentiment/auto-label/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tweets: trainingTweets }),
        }
      );

      const data = await res.json();
      setTrainingTweets(data.tweets);

      toast({
        title: "Auto-labeling complete",
        description: `${unlabeled.length} tweets labeled automatically`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "API failed to auto-label tweets",
        variant: "destructive",
      });
    }

    setIsClassifying(false);
  };

  const handleClassify = async () => {
    if (
      (classificationMethod === "knn" ||
        classificationMethod === "naiveBayes") &&
      trainingTweets.length === 0
    ) {
      toast({
        title: "No training data",
        description: "Please upload training data first",
        variant: "destructive",
      });
      return;
    }

    if (testTweets.length === 0) {
      toast({
        title: "No test data",
        description: "Please upload test data first",
        variant: "destructive",
      });
      return;
    }

    setIsClassifying(true);

    try {
      // Build params depending on the selected method
      let params: any = {};

      if (classificationMethod === "knn") {
        params = {
          k: knnParams.k,
          distance: knnParams.distanceType,
          vote: knnParams.voteType,
        };
      } else if (classificationMethod === "naiveBayes") {
        params = {
          representation: naiveBayesParams.representation, // "presence" | "frequency"
          wordFilter: naiveBayesParams.wordFilter, // "all" | "length3plus"
          ngramType: naiveBayesParams.ngramType, // "unigrams" | "bigrams" | "unigrams+bigrams"
        };
      }

      const res = await fetch(
        "https://backend-apii-o46a.onrender.com/api/sentiment/classify/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            training: trainingTweets,
            test: testTweets,
            method: classificationMethod,
            params,
          }),
        }
      );

      const data = await res.json();
      setTestTweets(data.classified);

      toast({
        title: "Classification complete",
        description: `${data.classified.length} tweets classified successfully`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "API Error",
        description: "Failed to classify tweets",
        variant: "destructive",
      });
    }

    setIsClassifying(false);
  };

  const unlabeledCount = trainingTweets.filter((t) => !t.label).length;

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
              onValueChange={(value: "knn" | "dictionary" | "naiveBayes") =>
                setClassificationMethod(value)
              }
            >
              <SelectTrigger id="method-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="knn">K-Nearest Neighbors (KNN)</SelectItem>
                <SelectItem value="naiveBayes">Naive Bayes</SelectItem>
                <SelectItem value="dictionary">
                  Dictionary-based Sentiment
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {classificationMethod === "knn"
                ? "Uses training data to classify based on nearest neighbors"
                : classificationMethod === "naiveBayes"
                ? "Uses probabilistic model with Laplace smoothing for classification"
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
                  onValueChange={([value]) =>
                    setKnnParams({ ...knnParams, k: value })
                  }
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
                    <SelectItem value="weighted">
                      Weighted Vote (Bonus)
                    </SelectItem>
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
                    <SelectItem value="cosine">
                      Cosine Distance (Bonus)
                    </SelectItem>
                    <SelectItem value="levenshtein">
                      Levenshtein Distance (Bonus)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the distance metric for comparing tweet similarity
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {classificationMethod === "naiveBayes" && (
          <Card>
            <CardHeader>
              <CardTitle>Naive Bayes Configuration</CardTitle>
              <CardDescription>
                Choose algorithm variations for sentiment classification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="representation">Representation Type</Label>
                <Select
                  value={naiveBayesParams.representation}
                  onValueChange={(value: "presence" | "frequency") =>
                    setNaiveBayesParams({
                      ...naiveBayesParams,
                      representation: value,
                    })
                  }
                >
                  <SelectTrigger id="representation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presence">Presence (Binary)</SelectItem>
                    <SelectItem value="frequency">Frequency (Count)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {naiveBayesParams.representation === "presence"
                    ? "Binary presence: words are either present or not"
                    : "Frequency-based: counts word occurrences"}
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="word-filter">Word Filtering</Label>
                <Select
                  value={naiveBayesParams.wordFilter}
                  onValueChange={(value: "all" | "length3plus") =>
                    setNaiveBayesParams({
                      ...naiveBayesParams,
                      wordFilter: value,
                    })
                  }
                >
                  <SelectTrigger id="word-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Words</SelectItem>
                    <SelectItem value="length3plus">
                      Words &gt; 3 Letters
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {naiveBayesParams.wordFilter === "all"
                    ? "Include all words in vocabulary"
                    : "Filter out short words (≤3 letters) like articles and pronouns"}
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="ngram-type">N-gram Type</Label>
                <Select
                  value={naiveBayesParams.ngramType}
                  onValueChange={(
                    value: "unigrams" | "bigrams" | "unigrams+bigrams"
                  ) =>
                    setNaiveBayesParams({
                      ...naiveBayesParams,
                      ngramType: value,
                    })
                  }
                >
                  <SelectTrigger id="ngram-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unigrams">Unigrams Only</SelectItem>
                    <SelectItem value="bigrams">Bigrams Only</SelectItem>
                    <SelectItem value="unigrams+bigrams">
                      Unigrams + Bigrams
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {naiveBayesParams.ngramType === "unigrams"
                    ? "Single words only"
                    : naiveBayesParams.ngramType === "bigrams"
                    ? "Two consecutive words"
                    : "Combination of single words and word pairs"}
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
                <span className="font-mono font-medium">
                  {trainingTweets.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Test samples:</span>
                <span className="font-mono font-medium">
                  {testTweets.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Algorithm:</span>
                <span className="font-medium">
                  {classificationMethod === "knn"
                    ? "K-Nearest Neighbors"
                    : classificationMethod === "naiveBayes"
                    ? "Naive Bayes"
                    : "Dictionary-based"}
                </span>
              </div>
            </div>

            <Button
              onClick={handleClassify}
              disabled={
                isClassifying ||
                ((classificationMethod === "knn" ||
                  classificationMethod === "naiveBayes") &&
                  trainingTweets.length === 0) ||
                testTweets.length === 0
              }
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

            {classificationMethod === "naiveBayes" && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">Current Configuration:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Representation: {naiveBayesParams.representation}</li>
                  <li>
                    • Word filter:{" "}
                    {naiveBayesParams.wordFilter === "all"
                      ? "All words"
                      : "Words > 3 letters"}
                  </li>
                  <li>• N-grams: {naiveBayesParams.ngramType}</li>
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
