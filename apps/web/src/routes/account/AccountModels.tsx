import { AccountCard } from "@/components/AccountCard";
import {
  useModel,
  models,
  ModelProvider,
  pinnedModelIdsDefault,
} from "@/contexts/ModelContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import ModelIcon from "@/components/icons/model-icon";
import { CapabilityBadges } from "@/components/ui/capability-badges";
import { Badge } from "@/components/ui/badge";

export default function AccountModels() {
  const {
    enabledModels,
    toggleModelEnabled,
    isModelEnabled,
    enableAllModels,
    disableAllModels,
  } = useModel();

  return (
    <div className="flex flex-col gap-8 w-full">
      <title>Models | Aether</title>
      <AccountCard
        title="Available Models"
        description="Toggle which models appear in your model selector"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            {models.map((model) => {
              const isPinned = pinnedModelIdsDefault.includes(model.id);
              return (
                <div
                  key={model.id}
                  className="flex flex-col rounded-lg border bg-card backdrop-blur-sm overflow-hidden"
                >
                  <div className="flex gap-4 flex-1 p-4 border-b">
                    <div>
                      <ModelIcon
                        model={model.icon}
                        className="size-6 fill-primary"
                      />
                    </div>
                    <div className="flex gap-1 flex-1">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          {model.access === "premium_required" && (
                            <Badge className="text-xs" variant="outline">
                              PRO
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {model.description}
                        </p>
                      </div>
                      <Switch
                        checked={isModelEnabled(model.id)}
                        onCheckedChange={() => toggleModelEnabled(model.id)}
                        disabled={
                          model.access === "premium_required" || isPinned
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-sidebar justify-between">
                    <div>
                      {model.capabilities && model.capabilities.length > 0 && (
                        <div className="flex items-center gap-1">
                          <CapabilityBadges capabilities={model.capabilities} />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {model.credits} credits
                      {Number(model.credits ?? 0) > 1 ? "s" : ""}/message
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
            <strong>Note:</strong> At least one model must remain enabled.
            Disabled models won't appear in your model selector. Your
            preferences are saved automatically.
          </div>
        </div>
      </AccountCard>
    </div>
  );
}
