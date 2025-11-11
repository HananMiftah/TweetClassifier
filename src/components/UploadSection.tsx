import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, Database, TestTube, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tweet } from "@/pages/Index";
import { cleanTweet } from "@/lib/cleaning";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface UploadSectionProps {
  trainingTweets: Tweet[];
  setTrainingTweets: (tweets: Tweet[]) => void;
  testTweets: Tweet[];
  setTestTweets: (tweets: Tweet[]) => void;
}

const UploadSection = ({ trainingTweets, setTrainingTweets, testTweets, setTestTweets }: UploadSectionProps) => {
  const { toast } = useToast();
  const [trainingFile, setTrainingFile] = useState<File | null>(null);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [testSplitPercentage, setTestSplitPercentage] = useState([30]); // 30% for test by default

  const detectDelimiter = (lines: string[]): string => {
    if (lines.length === 0) return ',';
    
    // Check first few lines for common delimiters
    const sampleLine = lines[0];
    const semicolonCount = (sampleLine.match(/;/g) || []).length;
    const commaCount = (sampleLine.match(/,/g) || []).length;
    
    // Return the delimiter that appears more frequently
    return semicolonCount > commaCount ? ';' : ',';
  };

  const parseCsvLine = (line: string, delimiter: string = ','): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(field => field.replace(/^"|"$/g, '').trim());
  };

  const detectColumns = (lines: string[], delimiter: string): { tweetCol: number; labelCol: number } => {
    if (lines.length < 2) return { tweetCol: 0, labelCol: 0 };
    
    // Parse sample rows (no header assumption)
    const startIdx = 0; // Start from first line, no header skip
    const sampleRows = lines.slice(startIdx, Math.min(startIdx + 10, lines.length)).map(line => parseCsvLine(line, delimiter));
    if (sampleRows.length === 0 || sampleRows[0].length === 0) return { tweetCol: 0, labelCol: 0 };
    
    const numColumns = sampleRows[0].length;
    
    // Analyze each column based on data only
    const columnStats = Array.from({ length: numColumns }, (_, colIdx) => {
      const values = sampleRows.map(row => row[colIdx] || '').filter(v => v.length > 0);
      if (values.length === 0) return { 
        colIdx, 
        avgLength: 0, 
        wordCount: 0,
        alphaRatio: 0,
        spaceCount: 0,
        hasLabel: false, 
        isNumeric: false,
        score: 0
      };
      
      // Calculate text statistics
      const avgLength = values.reduce((sum, val) => sum + val.length, 0) / values.length;
      
      // Count words (sequences of letters separated by spaces)
      const avgWordCount = values.reduce((sum, val) => {
        const words = val.match(/[a-zA-Z]+/g);
        return sum + (words ? words.length : 0);
      }, 0) / values.length;
      
      // Calculate ratio of alphabetical characters
      const avgAlphaRatio = values.reduce((sum, val) => {
        const alphaCount = (val.match(/[a-zA-Z]/g) || []).length;
        return sum + (val.length > 0 ? alphaCount / val.length : 0);
      }, 0) / values.length;
      
      // Count spaces (natural text has spaces between words)
      const avgSpaceCount = values.reduce((sum, val) => {
        return sum + (val.match(/\s/g) || []).length;
      }, 0) / values.length;
      
      // Check for sentiment labels
      const hasLabel = values.some(val => ['0', '4', 'positive', 'negative', 'neutral'].includes(val.toLowerCase().trim()));
      
      // Check if numeric (but exclude long numbers like IDs)
      const isNumeric = values.every(val => !isNaN(Number(val))) && avgLength < 5;
      
      // Calculate score for tweet likelihood (higher = more likely to be tweet)
      // Prioritize: word count, alphabetical ratio, presence of spaces
      const score = (avgWordCount * 2) + (avgAlphaRatio * 50) + (avgSpaceCount * 1.5);
      
      return { 
        colIdx, 
        avgLength,
        wordCount: avgWordCount,
        alphaRatio: avgAlphaRatio,
        spaceCount: avgSpaceCount,
        hasLabel, 
        isNumeric,
        score
      };
    });
    
    // Find tweet column: highest score (indicating natural language text)
    const tweetCol = columnStats.reduce((max, stat) => 
      stat.score > max.score ? stat : max
    ).colIdx;
    
    // Find label column: has sentiment labels OR is short numeric (but not tweet column)
    const labelCol = columnStats.find(stat => 
      (stat.hasLabel || (stat.isNumeric && stat.colIdx !== tweetCol))
    )?.colIdx ?? 0;
    
    return { tweetCol, labelCol };
  };

  const handleTrainingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTrainingFile(file);
    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());
    
    // Detect delimiter
    const delimiter = detectDelimiter(lines);
    
    // Detect columns
    const { tweetCol, labelCol } = detectColumns(lines, delimiter);
    
    // Parse data (no header skip since we don't assume headers exist)
    const tweets: Tweet[] = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = parseCsvLine(lines[i], delimiter);
      if (parts.length === 0) continue;
      
      const labelValue = parts[labelCol]?.trim();
      const tweetText = parts[tweetCol]?.trim() || "";
      
      if (!tweetText) continue;
      
      const cleaned = cleanTweet(tweetText);
      
      tweets.push({
        id: i,
        text: tweetText,
        cleaned,
        label: labelValue === "0" ? "negative" : labelValue === "4" ? "positive" : "neutral"
      });
    }

    setTrainingTweets(tweets);
    toast({
      title: "Training data loaded",
      description: `${tweets.length} tweets loaded successfully`,
    });
  };

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTestFile(file);
    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());
    
    // Detect delimiter
    const delimiter = detectDelimiter(lines);
    
    // Detect columns
    const { tweetCol, labelCol } = detectColumns(lines, delimiter);
    
    // Parse data
    const tweets: Tweet[] = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = parseCsvLine(lines[i], delimiter);
      if (parts.length === 0) continue;
      
      const labelValue = parts[labelCol]?.trim();
      const tweetText = parts[tweetCol]?.trim() || "";
      
      if (!tweetText) continue;
      
      const cleaned = cleanTweet(tweetText);
      
      // Parse label if it exists (for accuracy calculation)
      let label: "positive" | "negative" | "neutral" | undefined = undefined;
      if (labelValue === "0") label = "negative";
      else if (labelValue === "4") label = "positive";
      else if (labelValue && labelValue !== "target" && labelValue !== "label") label = "neutral";
      
      tweets.push({
        id: i,
        text: tweetText,
        cleaned,
        label
      });
    }

    setTestTweets(tweets);
    toast({
      title: "Test data loaded",
      description: `${tweets.length} tweets loaded successfully`,
    });
  };

  const handleSingleDatasetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSingleFile(file);
    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());
    
    // Detect delimiter
    const delimiter = detectDelimiter(lines);
    
    // Detect columns
    const { tweetCol, labelCol } = detectColumns(lines, delimiter);
    
    // Parse all tweets
    const allTweets: Tweet[] = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = parseCsvLine(lines[i], delimiter);
      if (parts.length === 0) continue;
      
      const labelValue = parts[labelCol]?.trim();
      const tweetText = parts[tweetCol]?.trim() || "";
      
      if (!tweetText) continue;
      
      const cleaned = cleanTweet(tweetText);
      
      allTweets.push({
        id: i,
        text: tweetText,
        cleaned,
        label: labelValue === "0" ? "negative" : labelValue === "4" ? "positive" : "neutral"
      });
    }

    // Shuffle the array randomly
    const shuffled = [...allTweets].sort(() => Math.random() - 0.5);
    
    // Split based on percentage
    const testSize = Math.floor(shuffled.length * (testSplitPercentage[0] / 100));
    const testSet = shuffled.slice(0, testSize);
    const trainingSet = shuffled.slice(testSize);

    setTestTweets(testSet);
    setTrainingTweets(trainingSet);
    
    toast({
      title: "Dataset split successfully",
      description: `Training: ${trainingSet.length} tweets, Test: ${testSet.length} tweets`,
    });
  };

  return (
    <Tabs defaultValue="separate" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="separate">Separate Uploads</TabsTrigger>
        <TabsTrigger value="split">Single Dataset (Auto-Split)</TabsTrigger>
      </TabsList>

      <TabsContent value="separate">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>Training Data</CardTitle>
              </div>
              <CardDescription>
                Upload CSV file with labeled tweets for model training
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleTrainingUpload}
                  className="hidden"
                  id="training-upload"
                />
                <label htmlFor="training-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">Click to upload training data</p>
                  <p className="text-xs text-muted-foreground">CSV format with labels</p>
                </label>
              </div>
              
              {trainingFile && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{trainingFile.name} ({trainingTweets.length} tweets)</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-accent" />
                <CardTitle>Test Data</CardTitle>
              </div>
              <CardDescription>
                Upload CSV file with unlabeled tweets for classification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleTestUpload}
                  className="hidden"
                  id="test-upload"
                />
                <label htmlFor="test-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">Click to upload test data</p>
                  <p className="text-xs text-muted-foreground">CSV format without labels</p>
                </label>
              </div>
              
              {testFile && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{testFile.name} ({testTweets.length} tweets)</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="split">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-primary" />
              <CardTitle>Upload Single Dataset</CardTitle>
            </div>
            <CardDescription>
              Upload one CSV file with labeled tweets - it will be randomly split into training and test sets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="split-percentage" className="text-sm font-medium">
                  Test Set Size: {testSplitPercentage[0]}%
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Training: {100 - testSplitPercentage[0]}% | Test: {testSplitPercentage[0]}%
                </p>
                <Slider
                  id="split-percentage"
                  min={10}
                  max={50}
                  step={5}
                  value={testSplitPercentage}
                  onValueChange={setTestSplitPercentage}
                  className="w-full"
                />
              </div>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleSingleDatasetUpload}
                className="hidden"
                id="single-upload"
              />
              <label htmlFor="single-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">Click to upload dataset</p>
                <p className="text-xs text-muted-foreground">CSV format with labels - will be split automatically</p>
              </label>
            </div>
            
            {singleFile && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{singleFile.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Training Set</p>
                    <p className="font-semibold text-primary">{trainingTweets.length} tweets</p>
                  </div>
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Test Set</p>
                    <p className="font-semibold text-accent">{testTweets.length} tweets</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default UploadSection;
