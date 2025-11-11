import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tweet } from "@/pages/Index";
import { Smile, Frown, Minus, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TweetsDisplayProps {
  trainingTweets: Tweet[];
  testTweets: Tweet[];
  setTestTweets: (tweets: Tweet[]) => void;
}

const TweetsDisplay = ({ trainingTweets, testTweets, setTestTweets }: TweetsDisplayProps) => {
  const { toast } = useToast();

  const getLabelBadge = (label?: string) => {
    if (!label) return <Badge variant="outline">Unlabeled</Badge>;
    
    const config = {
      positive: { icon: Smile, variant: "default" as const, color: "bg-success text-success-foreground" },
      negative: { icon: Frown, variant: "destructive" as const, color: "bg-destructive text-destructive-foreground" },
      neutral: { icon: Minus, variant: "secondary" as const, color: "bg-secondary text-secondary-foreground" }
    };
    
    const { icon: Icon, color } = config[label as keyof typeof config] || config.neutral;
    
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const handleManualAnnotation = (tweetId: number, label: string) => {
    const updated = testTweets.map(tweet =>
      tweet.id === tweetId ? { ...tweet, label } : tweet
    );
    setTestTweets(updated);
    
    toast({
      title: "Annotation saved",
      description: `Tweet labeled as ${label}`,
    });
  };

  const downloadAnnotations = () => {
    const csv = testTweets.map(t => 
      `"${t.text}","${t.label || ""}","${t.predictedLabel || ""}"`
    ).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "annotated_tweets.csv";
    a.click();
    
    toast({
      title: "Download started",
      description: "Annotations saved to CSV file",
    });
  };

  return (
    <Tabs defaultValue="training" className="space-y-4">
      <TabsList>
        <TabsTrigger value="training">Training Data ({trainingTweets.length})</TabsTrigger>
        <TabsTrigger value="test">Test Data ({testTweets.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="training">
        <Card>
          <CardHeader>
            <CardTitle>Training Tweets</CardTitle>
            <CardDescription>Labeled tweets used for model training</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Original Text</TableHead>
                    <TableHead>Cleaned Text</TableHead>
                    <TableHead className="w-32">Label</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingTweets.slice(0, 50).map((tweet) => (
                    <TableRow key={tweet.id}>
                      <TableCell className="font-mono text-xs">{tweet.id}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{tweet.text}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {tweet.cleaned}
                      </TableCell>
                      <TableCell>{getLabelBadge(tweet.label)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {trainingTweets.length > 50 && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing first 50 of {trainingTweets.length} tweets
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="test">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Test Tweets</CardTitle>
              <CardDescription>Annotate and classify unlabeled tweets</CardDescription>
            </div>
            {testTweets.length > 0 && (
              <Button onClick={downloadAnnotations} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Tweet Text</TableHead>
                    <TableHead className="w-48">Manual Label</TableHead>
                    <TableHead className="w-32">Predicted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testTweets.slice(0, 50).map((tweet) => (
                    <TableRow key={tweet.id}>
                      <TableCell className="font-mono text-xs">{tweet.id}</TableCell>
                      <TableCell className="text-sm max-w-md">{tweet.cleaned || tweet.text}</TableCell>
                      <TableCell>
                        <Select
                          value={tweet.label || ""}
                          onValueChange={(value) => handleManualAnnotation(tweet.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select label" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="positive">Positive</SelectItem>
                            <SelectItem value="negative">Negative</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{getLabelBadge(tweet.predictedLabel)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {testTweets.length > 50 && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing first 50 of {testTweets.length} tweets
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default TweetsDisplay;
