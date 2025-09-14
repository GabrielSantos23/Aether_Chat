"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function TestResendPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    emailId?: string;
    error?: string;
  } | null>(null);

  const sendTestEmail = async () => {
    if (!email) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          emailId: data.emailId,
        });
      } else {
        setResult({
          success: false,
          message: "Failed to send email",
          error: data.error || data.details,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Network error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Resend Integration</CardTitle>
          <CardDescription>
            Send a test email to verify that Resend is working correctly with
            your Aether AI application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={sendTestEmail}
            disabled={!email || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Test Email...
              </>
            ) : (
              "Send Test Email"
            )}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-md ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      result.success ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.emailId && (
                    <p className="text-xs text-green-600 mt-1">
                      Email ID: {result.emailId}
                    </p>
                  )}
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">
                      Error: {result.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> Make sure you have configured the following
              environment variables:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <code>RESEND_API_KEY</code> - Your Resend API key
              </li>
              <li>
                <code>EMAIL_FROM</code> - The sender email address (e.g.,
                onboarding@resend.dev)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
