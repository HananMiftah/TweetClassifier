import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Brain, TrendingUp, Network } from "lucide-react";
import heroImage from "@/assets/emotion-detection-hero.jpg";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Tweet Sentiment Analyzer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced machine learning platform for analyzing emotions in tweets using KNN classification and clustering algorithms
          </p>
        </header>

        <div className="max-w-6xl mx-auto mb-16">
          <img
            src={heroImage}
            alt="Emotion detection visualization showing positive, negative, and neutral sentiment analysis"
            className="rounded-2xl shadow-2xl w-full object-cover"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">Smart Classification</h3>
            <p className="text-muted-foreground">
              Detect positive, negative, and neutral emotions using K-Nearest Neighbors and dictionary-based methods
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Network className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">Advanced Clustering</h3>
            <p className="text-muted-foreground">
              Group similar tweets using hierarchical clustering with Average, Complete, and Ward methods
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">Detailed Analytics</h3>
            <p className="text-muted-foreground">
              Evaluate results with accuracy metrics, confusion matrices, and Rand index comparisons
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => navigate("/analyzer")}
            className="text-lg px-8 py-6 h-auto"
          >
            Start Analyzing Tweets
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
