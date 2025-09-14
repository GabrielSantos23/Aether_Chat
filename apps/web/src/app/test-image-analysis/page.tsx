"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestImageAnalysisPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const analyzeImage = async () => {
    if (!imageUrl.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/test-image-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const result = await response.json();
      setAnalysis(result.analysis || "No analysis available");
    } catch (error) {
      console.error("Error analyzing image:", error);
      setAnalysis("Error analyzing image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">Image Analysis Test</h1>

      <Card>
        <CardHeader>
          <CardTitle>Test Image Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Image URL (UploadThing URL):
            </label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://utfs.io/f/..."
            />
          </div>

          <Button
            onClick={analyzeImage}
            disabled={!imageUrl.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? "Analyzing..." : "Analyze Image"}
          </Button>

          {analysis && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Analysis Result:</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{analysis}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to the main chat interface</li>
            <li>Upload an image using the attachment button</li>
            <li>Copy the UploadThing URL from the network tab or console</li>
            <li>Paste it here and click "Analyze Image"</li>
            <li>Or ask the AI to describe the image directly in the chat</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}



