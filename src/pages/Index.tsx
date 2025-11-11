import { useState } from "react";
import { Upload, FileText, Settings, BarChart3, Network } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import UploadSection from "@/components/UploadSection";
import TweetsDisplay from "@/components/TweetsDisplay";
import KNNConfig from "@/components/KNNConfig";
import ResultsDisplay from "@/components/ResultsDisplay";
import ClusteringSection from "@/components/ClusteringSection";

export interface Tweet {
  id: number;
  text: string;
  label?: string;
  predictedLabel?: string;
  cleaned?: string;
}

export interface KNNParams {
  k: number;
  voteType: "majority" | "weighted";
  distanceType: "default" | "levenshtein" | "jaccard" | "cosine";
}

const Index = () => {
  const [trainingTweets, setTrainingTweets] = useState<Tweet[]>([]);
  const [testTweets, setTestTweets] = useState<Tweet[]>([]);
  const [knnParams, setKnnParams] = useState<KNNParams>({
    k: 3,
    voteType: "majority",
    distanceType: "default"
  });
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationMethod, setClassificationMethod] = useState<"knn" | "dictionary">("knn");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tweet Sentiment Analyzer</h1>
              <p className="text-sm text-muted-foreground">Machine Learning Classification Platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <FileText className="h-4 w-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Configure
            </TabsTrigger>
            <TabsTrigger value="clustering" className="gap-2">
              <Network className="h-4 w-4" />
              Clustering
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <UploadSection 
              trainingTweets={trainingTweets}
              setTrainingTweets={setTrainingTweets}
              testTweets={testTweets}
              setTestTweets={setTestTweets}
            />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <TweetsDisplay 
              trainingTweets={trainingTweets}
              testTweets={testTweets}
              setTestTweets={setTestTweets}
            />
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <KNNConfig 
              knnParams={knnParams}
              setKnnParams={setKnnParams}
              trainingTweets={trainingTweets}
              testTweets={testTweets}
              setTestTweets={setTestTweets}
              setTrainingTweets={setTrainingTweets}
              isClassifying={isClassifying}
              setIsClassifying={setIsClassifying}
              classificationMethod={classificationMethod}
              setClassificationMethod={setClassificationMethod}
            />
          </TabsContent>

          <TabsContent value="clustering" className="space-y-6">
            <ClusteringSection tweets={trainingTweets} />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <ResultsDisplay 
              testTweets={testTweets}
              isClassifying={isClassifying}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
