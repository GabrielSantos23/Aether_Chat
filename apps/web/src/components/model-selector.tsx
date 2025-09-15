import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  models as sharedModels,
  pinnedModelIdsDefault,
  type Model,
} from "@/components/models";
import { CapabilityBadges } from "./ui/capability-badges";
import { useSession } from "next-auth/react";
import ModelIcon from "./icons/model-icon";
import { useModel } from "@/contexts/ModelContext";
import { toast } from "sonner";

const useQuery = (endpoint: any, params: any) => {
  if (params === "skip" || !params) return null;
  return {
    modelId: "gemini-2.0-flash",
    pinnedModels: pinnedModelIdsDefault,
  };
};

const useMutation = (endpoint: any) => {
  return async (params: any) => {
    return Promise.resolve();
  };
};

const api = {
  settings: {
    get: "mock-settings-get",
    update: "mock-settings-update",
  },
};

export default function ModelSelector() {
  const { data: session, status } = useSession();
  const {
    selectedModelId,
    setSelectedModelId,
    selectedModel,
    enabledModelsList,
    isModelEnabled,
  } = useModel();
  const isPending = status === "loading";

  const [open, setOpen] = useState<boolean>(false);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [hoveredModel, setHoveredModel] = useState<Model | null>(null);

  const user = session?.user;

  const settings = useQuery(
    api.settings.get,
    user ? { userId: user.email } : "skip"
  );

  const updateSettings = useMutation(api.settings.update);

  const [pinnedModelIds, setPinnedModelIds] = useState<string[]>(
    settings?.pinnedModels || pinnedModelIdsDefault
  );

  useEffect(() => {}, [selectedModelId, selectedModel]);

  const availableModels = enabledModelsList;
  const pinnedModels = availableModels.filter((model) =>
    pinnedModelIds.includes(model.id)
  );
  const otherModels = availableModels.filter(
    (model) => !pinnedModelIds.includes(model.id)
  );

  useEffect(() => {
    if (!open) {
      setHoveredModel(null);
      setShowAll(false);
    }
  }, [open]);

  const handleSelectModel = async (model: Model) => {
    if (!isModelEnabled(model.id)) {
      toast.error(
        `${model.name} is currently disabled. Enable it in account settings.`
      );
      return;
    }

    setSelectedModelId(model.id);
    setOpen(false);

    if (user) {
      try {
        await updateSettings({
          userId: user.email,
          modelId: model.id,
        });
      } catch (error) {
        console.error("Failed to update model:", error);
        setSelectedModelId(settings?.modelId || "gemini-2.0-flash");
      }
    }
  };

  const handleTogglePin = async (modelId: string, shouldPin: boolean) => {
    if (!user) return;

    const current = pinnedModelIds;
    const activeModelCount = current.length;
    let updated;

    if (shouldPin) {
      if (current.includes(modelId)) return;
      updated = [...current, modelId];
    } else {
      if (activeModelCount <= 1) {
        return;
      }
      updated = current.filter((id) => id !== modelId);
    }

    setPinnedModelIds(updated);

    try {
      await updateSettings({
        userId: user.email,
        pinnedModels: updated,
      });
    } catch (error) {
      console.error("Failed to update pinned models:", error);
      setPinnedModelIds(settings?.pinnedModels || pinnedModelIdsDefault);
    }
  };

  if (isPending) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Button variant="ghost" disabled>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-4 h-4 rounded bg-gray-200 animate-pulse" />
            <span className="truncate hidden md:block">Loading...</span>
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Button variant="ghost" disabled>
          <div className="flex items-center gap-2 flex-1">
            <span className="truncate">Sign in to select models</span>
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </div>
    );
  }

  if (availableModels.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Button variant="ghost" disabled>
          <div className="flex items-center gap-2 flex-1">
            <span className="truncate">No models enabled</span>
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" aria-expanded={open} key={selectedModelId}>
            <div className="flex items-center gap-2 flex-1">
              {selectedModel && (
                <ModelIcon
                  className="fill-primary"
                  model={selectedModel.icon}
                />
              )}
              <span className="truncate hidden md:block">
                {selectedModel?.name || "Select Model"}
              </span>
              {selectedModel?.access === "premium_required" && (
                <span className="text-[10px] font-medium text-primary px-2 py-0.5 rounded-full z-1 bg-primary/10">
                  PRO
                </span>
              )}
            </div>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn("p-0 relative min-w-[350px]")}
          align="start"
        >
          <Command>
            <CommandInput placeholder="Find Model..." className="h-9" />
            <CommandList className={cn(showAll && "max-h-[500px]")}>
              <CommandEmpty>No model found.</CommandEmpty>

              {!showAll && (
                <CommandGroup>
                  {pinnedModels?.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={`${model.name} ${model.description}`}
                      onMouseEnter={() => setHoveredModel(model)}
                      onSelect={() => handleSelectModel(model)}
                      onClick={() => handleSelectModel(model)}
                      className="cursor-pointer"
                      disabled={model.access === "premium_required"}
                    >
                      <span className="flex items-center gap-2 flex-1">
                        {model.icon && (
                          <ModelIcon
                            className="fill-primary"
                            model={model.icon}
                          />
                        )}
                        <span className="truncate">{model.name}</span>
                        {model.access === "premium_required" && (
                          <span className="text-[10px] font-medium text-primary px-2 py-0.5 rounded-full z-1 bg-primary/10">
                            PRO
                          </span>
                        )}
                      </span>
                      <CapabilityBadges
                        capabilities={model.capabilities ?? []}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {showAll && (
                <>
                  <CommandGroup heading="Pinned Models">
                    {pinnedModels?.map((model) => (
                      <CommandItem
                        key={`pinned-${model.id}`}
                        value={`${model.name}`}
                        onMouseEnter={() => setHoveredModel(model)}
                        onSelect={() => handleSelectModel(model)}
                        onClick={() => handleSelectModel(model)}
                        className="cursor-pointer"
                        disabled={model.access === "premium_required"}
                      >
                        <span className="flex items-center gap-2 flex-1">
                          {model.icon && (
                            <ModelIcon
                              className="fill-primary"
                              model={model.icon}
                            />
                          )}
                          <span className="truncate">{model.name}</span>
                          {model.access === "premium_required" && (
                            <span className="text-[10px] font-medium text-primary px-2 py-0.5 rounded-full z-1 bg-primary/10">
                              PRO
                            </span>
                          )}
                        </span>
                        <CapabilityBadges
                          capabilities={model.capabilities ?? []}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(model.id, false);
                            }}
                            aria-label="Unpin model"
                          >
                            <PinOff className="opacity-70 size-3" />
                          </Button>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Other Models">
                    {otherModels?.map((model) => (
                      <CommandItem
                        key={`other-${model.id}`}
                        value={`${model.name}`}
                        onMouseEnter={() => setHoveredModel(model)}
                        onSelect={() => handleSelectModel(model)}
                        onClick={() => handleSelectModel(model)}
                        className="cursor-pointer"
                        disabled={model.access === "premium_required"}
                      >
                        <span className="flex items-center gap-2 flex-1">
                          {model.icon && (
                            <ModelIcon
                              className="fill-primary"
                              model={model.icon}
                            />
                          )}
                          <span className="truncate">{model.name}</span>
                          {model.access === "premium_required" && (
                            <span className="text-[10px] font-medium text-primary px-2 py-0.5 rounded-full z-1 bg-primary/10">
                              PRO
                            </span>
                          )}
                        </span>
                        <CapabilityBadges
                          capabilities={model.capabilities ?? []}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(model.id, true);
                            }}
                            aria-label="Pin model"
                          >
                            <Pin className="opacity-70 size-3" />
                          </Button>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
            <CommandSeparator />
            <div className="flex items-center justify-between p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowAll((prev) => !prev)}
              >
                {showAll ? "Show pinned only" : "Show all models"}
              </Button>
            </div>
          </Command>

          <div className="absolute top-0 right-0 translate-x-full pl-2 hidden md:block">
            {hoveredModel && (
              <div className="rounded-md flex flex-col gap-4 w-64 border border-foreground/10 overflow-hidden relative before:bg-sidebar/50 before:backdrop-blur-md before:absolute before:inset-0 before:z-[-1]">
                <div className="flex items-center gap-2 px-2 pt-2">
                  <ModelIcon
                    className="size-4 fill-primary"
                    model={hoveredModel.icon}
                  />
                  <span className="text-sm">{hoveredModel.name}</span>
                </div>
                <div className="flex items-center gap-2 px-2">
                  <CapabilityBadges capabilities={hoveredModel.capabilities} />
                </div>
                <div className="text-sm text-muted-foreground px-2">
                  {hoveredModel.description}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-between px-2 border-t border-foreground/10 pt-4 pb-4">
                  <div>Cost</div>
                  <div>
                    <span className="font-semibold">
                      {hoveredModel.credits} credit
                      {Number(hoveredModel.credits ?? 0) > 1 ? "s" : ""}
                    </span>
                    /message
                  </div>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
