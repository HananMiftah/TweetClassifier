import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tweet } from "@/pages/Index";
import { CheckCircle2, XCircle, BarChart3, TrendingUp } from "lucide-react";

interface ResultsDisplayProps {
  testTweets: Tweet[];
  isClassifying: boolean;
}

const ResultsDisplay = ({ testTweets, isClassifying }: ResultsDisplayProps) => {
  const classifiedTweets = testTweets.filter(t => t.predictedLabel);
  const annotatedTweets = testTweets.filter(t => t.label && t.predictedLabel);
  
  const accuracy = annotatedTweets.length > 0
    ? (annotatedTweets.filter(t => t.label === t.predictedLabel).length / annotatedTweets.length) * 100
    : 0;

  const sentimentCounts = {
    positive: classifiedTweets.filter(t => t.predictedLabel === "positive").length,
    negative: classifiedTweets.filter(t => t.predictedLabel === "negative").length,
    neutral: classifiedTweets.filter(t => t.predictedLabel === "neutral").length
  };

  const confusionMatrix = () => {
    const matrix: { [key: string]: { [key: string]: number } } = {
      positive: { positive: 0, negative: 0, neutral: 0 },
      negative: { positive: 0, negative: 0, neutral: 0 },
      neutral: { positive: 0, negative: 0, neutral: 0 }
    };

    annotatedTweets.forEach(tweet => {
      if (tweet.label && tweet.predictedLabel) {
        matrix[tweet.label][tweet.predictedLabel]++;
      }
    });

    return matrix;
  };

  if (classifiedTweets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No classification results yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Configure and run the KNN algorithm to see results
          </p>
        </CardContent>
      </Card>
    );
  }

  const matrix = confusionMatrix();

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Classified Tweets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{classifiedTweets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total predictions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{accuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {annotatedTweets.length} annotated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Positive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{sentimentCounts.positive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((sentimentCounts.positive / classifiedTweets.length) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Negative</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{sentimentCounts.negative}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((sentimentCounts.negative / classifiedTweets.length) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Neutral</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{sentimentCounts.neutral}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((sentimentCounts.neutral / classifiedTweets.length) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Confusion Matrix */}
      {annotatedTweets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Confusion Matrix</CardTitle>
            <CardDescription>
              Comparison of manual annotations vs predicted labels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-3 bg-muted text-left font-medium">Actual \ Predicted</th>
                    <th className="border p-3 bg-muted text-center font-medium">Positive</th>
                    <th className="border p-3 bg-muted text-center font-medium">Negative</th>
                    <th className="border p-3 bg-muted text-center font-medium">Neutral</th>
                  </tr>
                </thead>
                <tbody>
                  {(["positive", "negative", "neutral"] as const).map(actual => (
                    <tr key={actual}>
                      <td className="border p-3 font-medium capitalize bg-muted">{actual}</td>
                      {(["positive", "negative", "neutral"] as const).map(predicted => {
                        const value = matrix[actual][predicted];
                        const isCorrect = actual === predicted;
                        return (
                          <td
                            key={predicted}
                            className={`border p-3 text-center ${
                              isCorrect ? "bg-success/10 font-bold" : ""
                            }`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Results */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Classification Results</CardTitle>
          <CardDescription>First 10 classified tweets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {classifiedTweets.slice(0, 10).map(tweet => (
              <div key={tweet.id} className="border rounded-lg p-4 space-y-2">
                <p className="text-sm">{tweet.cleaned || tweet.text}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Predicted:</span>
                    <Badge className="capitalize">{tweet.predictedLabel}</Badge>
                  </div>
                  {tweet.label && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Actual:</span>
                        <Badge variant="outline" className="capitalize">{tweet.label}</Badge>
                      </div>
                      {tweet.label === tweet.predictedLabel ? (
                        <CheckCircle2 className="h-4 w-4 text-success ml-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive ml-auto" />
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsDisplay;
