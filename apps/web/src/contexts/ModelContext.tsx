"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { models, pinnedModelIdsDefault } from "@/components/models";

interface ModelContextType {
  selectedModelId: string;
  setSelectedModelId: (modelId: string) => void;
  selectedModel: (typeof models)[0] | undefined;
  enabledModels: Set<string>;
  setEnabledModels: (models: Set<string>) => void;
  enabledModelsList: typeof models;
  toggleModelEnabled: (modelId: string) => void;
  isModelEnabled: (modelId: string) => boolean;
  enableAllModels: () => void;
  disableAllModels: () => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ENABLED_MODELS: "aether_enabled_models",
  SELECTED_MODEL: "aether_selected_model",
};

export function ModelProvider({ children }: { children: ReactNode }) {
  const [selectedModelId, setSelectedModelIdState] =
    useState<string>("gemini-2.0-flash");
  const [enabledModels, setEnabledModelsState] = useState<Set<string>>(
    new Set(models.map((model) => model.id))
  );
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedEnabledModels = localStorage.getItem(
          STORAGE_KEYS.ENABLED_MODELS
        );
        if (savedEnabledModels) {
          const parsedEnabledModels = JSON.parse(savedEnabledModels);
          if (
            Array.isArray(parsedEnabledModels) &&
            parsedEnabledModels.length > 0
          ) {
            // Merge saved list with current models so newly added models appear by default
            const currentModelIds = new Set(models.map((m) => m.id));
            const merged = new Set<string>();
            // Keep only valid saved ids that still exist
            for (const id of parsedEnabledModels) {
              if (currentModelIds.has(id)) merged.add(id);
            }
            // Add any new model ids that weren't present when the user saved settings
            for (const id of currentModelIds) {
              if (!merged.has(id)) merged.add(id);
            }
            setEnabledModelsState(merged);
          }
        }

        const savedSelectedModel = localStorage.getItem(
          STORAGE_KEYS.SELECTED_MODEL
        );
        if (
          savedSelectedModel &&
          models.some((model) => model.id === savedSelectedModel)
        ) {
          setSelectedModelIdState(savedSelectedModel);
        }
      } catch (error) {
        console.error("Error loading model settings from localStorage:", error);
      } finally {
        setIsInitialized(true);
      }
    } else {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          STORAGE_KEYS.ENABLED_MODELS,
          JSON.stringify(Array.from(enabledModels))
        );
      } catch (error) {
        console.error("Error saving enabled models to localStorage:", error);
      }
    }
  }, [enabledModels, isInitialized]);

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, selectedModelId);
      } catch (error) {
        console.error("Error saving selected model to localStorage:", error);
      }
    }
  }, [selectedModelId, isInitialized]);

  const selectedModel = models.find((model) => model.id === selectedModelId);

  const enabledModelsList = models.filter((model) =>
    enabledModels.has(model.id)
  );

  const setSelectedModelId = (modelId: string) => {
    if (enabledModels.has(modelId)) {
      setSelectedModelIdState(modelId);
    } else {
      console.warn(`Cannot select disabled model: ${modelId}`);
    }
  };

  const setEnabledModels = (newEnabledModels: Set<string>) => {
    setEnabledModelsState(newEnabledModels);

    if (!newEnabledModels.has(selectedModelId) && newEnabledModels.size > 0) {
      setSelectedModelIdState(Array.from(newEnabledModels)[0]);
    }
  };

  const toggleModelEnabled = (modelId: string) => {
    const newEnabledModels = new Set(enabledModels);
    if (newEnabledModels.has(modelId)) {
      if (newEnabledModels.size <= 1) {
        return;
      }
      newEnabledModels.delete(modelId);
      if (modelId === selectedModelId && newEnabledModels.size > 0) {
        setSelectedModelIdState(Array.from(newEnabledModels)[0]);
      }
    } else {
      newEnabledModels.add(modelId);
    }
    setEnabledModelsState(newEnabledModels);
  };

  const isModelEnabled = (modelId: string): boolean => {
    return enabledModels.has(modelId);
  };

  const enableAllModels = () => {
    setEnabledModelsState(new Set(models.map((model) => model.id)));
  };

  const disableAllModels = () => {
    const firstModelId = models[0]?.id;
    if (firstModelId) {
      setEnabledModelsState(new Set([firstModelId]));
      setSelectedModelIdState(firstModelId);
    }
  };

  return (
    <ModelContext.Provider
      value={{
        selectedModelId,
        setSelectedModelId,
        selectedModel,
        enabledModels,
        setEnabledModels,
        enabledModelsList,
        toggleModelEnabled,
        isModelEnabled,
        enableAllModels,
        disableAllModels,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
}

export { models, pinnedModelIdsDefault } from "@/components/models";
