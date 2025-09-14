import { AccountCard } from "@/components/AccountCard";
import { SingleFieldForm } from "@/components/single-field-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, X, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import z from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@aether-ai-2/backend/convex/_generated/api";

// Schemas for validation
const roleSchema = z.object({
  value: z
    .string()
    .min(1, "Role is required")
    .max(50, "Role must be 50 characters or less"),
});

const traitSchema = z.object({
  value: z
    .string()
    .min(1, "Trait cannot be empty")
    .max(100, "Trait must be 100 characters or less"),
});

const templateSchema = z.object({
  value: z
    .string()
    .min(10, "Template must be at least 10 characters")
    .max(2000, "Template must be 2000 characters or less"),
});

const observationSchema = z.object({
  value: z
    .string()
    .min(5, "Observation must be at least 5 characters")
    .max(500, "Observation must be 500 characters or less"),
});

// Predefined role options
const ROLE_OPTIONS = [
  "Software Developer",
  "Designer",
  "Product Manager",
  "Data Scientist",
  "Marketing Manager",
  "Student",
  "Researcher",
  "Consultant",
  "Entrepreneur",
  "Other",
];

export function UserProfileCards() {
  const { data: session, update } = useSession();
  const settings = useQuery(api.users.getMySettings);
  const updateUserSettings = useMutation(api.users.updateUserSettings);

  const userProfile = {
    role: settings?.userRole || "",
    traits: settings?.userTraits || [],
    additionalInfo: settings?.userAdditionalInfo || "",
    promptTemplate: settings?.promptTemplate || "",
    observations: settings?.observations || [], // string[]
  } as {
    role: string;
    traits: string[];
    additionalInfo: string;
    promptTemplate: string;
    observations: string[];
  };

  const handleRoleUpdate = async (value: string) => {
    try {
      await updateUserSettings({ userRole: value });
      toast.success("Role updated successfully");
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleAddTrait = async (value: string) => {
    try {
      const newTraits = [...(userProfile.traits || []), value];
      await updateUserSettings({ userTraits: newTraits });
      toast.success("Trait added successfully");
    } catch (error) {
      toast.error("Failed to add trait");
    }
  };

  const handleRemoveTrait = async (traitToRemove: string) => {
    try {
      const newTraits = userProfile.traits.filter(
        (trait) => trait !== traitToRemove
      );
      await updateUserSettings({ userTraits: newTraits });
      toast.success("Trait removed successfully");
    } catch (error) {
      toast.error("Failed to remove trait");
    }
  };

  const handleAdditionalInfoUpdate = async (value: string) => {
    try {
      await updateUserSettings({ userAdditionalInfo: value });
      toast.success("Additional info updated successfully");
    } catch (error) {
      toast.error("Failed to update additional info");
    }
  };

  const handlePromptTemplateUpdate = async (value: string) => {
    try {
      await updateUserSettings({ promptTemplate: value });
      toast.success("Prompt template updated successfully");
    } catch (error) {
      toast.error("Failed to update prompt template");
    }
  };

  const handleAddObservation = async (value: string) => {
    try {
      const newObservations = [...(userProfile.observations || []), value];
      // Backend merges observations uniquely if provided
      await updateUserSettings({ observations: newObservations });
      toast.success("Observation added successfully");
    } catch (error) {
      toast.error("Failed to add observation");
    }
  };

  const handleRemoveObservation = async (observationId: string) => {
    try {
      const newObservations = (userProfile.observations || []).filter(
        (obs) => obs !== observationId
      );
      await updateUserSettings({ observations: newObservations });
      toast.success("Observation removed successfully");
    } catch (error) {
      toast.error("Failed to remove observation");
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* User Role Card */}
      <AccountCard
        title="User Role"
        description="Define your primary role or profession to help personalize interactions"
      >
        <SingleFieldForm
          label="Current Role"
          description="Select or enter your primary role or profession"
          footerMessage="This helps customize responses to your expertise level."
          defaultValue={userProfile.role}
          schema={roleSchema}
          renderInput={({ onChange, value }) => (
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          onSubmit={handleRoleUpdate}
        />
      </AccountCard>

      <Separator />

      {/* User Traits Card */}
      <AccountCard
        title="User Traits"
        description="Add personality traits and characteristics to personalize your experience"
      >
        <div className="space-y-4">
          <div className="p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {userProfile.traits.map((trait, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {trait}
                  <button
                    onClick={() => handleRemoveTrait(trait)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {userProfile.traits.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No traits added yet
                </p>
              )}
            </div>
          </div>

          <SingleFieldForm
            label="Add New Trait"
            description="Enter a personality trait or characteristic"
            footerMessage="Examples: analytical, creative, detail-oriented, collaborative"
            defaultValue=""
            schema={traitSchema}
            renderInput={({ onChange, value }) => (
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g., analytical, creative, detail-oriented"
              />
            )}
            onSubmit={handleAddTrait}
          />
        </div>
      </AccountCard>

      <Separator />

      {/* Additional Information Card */}
      <AccountCard
        title="Additional Information"
        description="Provide any additional context about yourself or your work"
      >
        <SingleFieldForm
          label="Additional Details"
          description="Share any other relevant information about yourself"
          footerMessage="This information helps provide more personalized assistance."
          defaultValue={userProfile.additionalInfo}
          renderInput={({ onChange, value }) => (
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Tell us more about your background, interests, or specific needs..."
              rows={4}
            />
          )}
          onSubmit={handleAdditionalInfoUpdate}
        />
      </AccountCard>

      <Separator />

      {/* Prompt Template Card */}
      <AccountCard
        title="Prompt Template"
        description="Customize how you want responses to be formatted and structured"
      >
        <div className="space-y-4">
          <SingleFieldForm
            label="Custom Prompt Template"
            description="Define how you want responses formatted (use {{content}} for the main response)"
            footerMessage="Advanced feature - leave empty to use default formatting."
            defaultValue={userProfile.promptTemplate}
            schema={templateSchema}
            renderInput={({ onChange, value }) => (
              <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Please provide {{content}} in a structured format with examples..."
                rows={6}
                className="font-mono text-sm"
              />
            )}
            onSubmit={handlePromptTemplateUpdate}
          />
        </div>
      </AccountCard>

      <Separator />

      {/* Observations Card */}
      <AccountCard
        title="Observations"
        description="Track insights and notes about your preferences and patterns"
      >
        <div className="space-y-4">
          <div className="p-4">
            <div className="space-y-3">
              {userProfile.observations.map((observation) => (
                <div
                  key={observation}
                  className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{observation}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveObservation(observation)}
                    className="text-muted-foreground hover:text-destructive ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {userProfile.observations.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No observations recorded yet
                </p>
              )}
            </div>
          </div>

          <SingleFieldForm
            label="Add Observation"
            description="Record a new insight or preference"
            footerMessage="These help improve future interactions and recommendations."
            defaultValue=""
            schema={observationSchema}
            renderInput={({ onChange, value }) => (
              <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="I noticed that I prefer detailed explanations with examples..."
                rows={3}
              />
            )}
            onSubmit={handleAddObservation}
          />
        </div>
      </AccountCard>
    </div>
  );
}
