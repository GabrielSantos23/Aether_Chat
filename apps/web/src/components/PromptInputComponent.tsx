import { cn } from "@/lib/utils";
import {
  AlertTriangleIcon,
  ArrowUpIcon,
  EditIcon,
  FileIcon,
  GlobeIcon,
  LogInIcon,
  MessageCircleIcon,
  TelescopeIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { match, P } from "ts-pattern";
import type { FC } from "react";
import { Button } from "./ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputAttachments,
  PromptInputFileUpload,
  PromptInputSubmit,
  PromptInputTextarea,
} from "./ai-elements/prompt-input";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface PromptInputComponentProps {
  hasMessages: boolean;
  attachedFiles: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  removeAttachedFile: (index: number) => void;
  editingMessageId: string | undefined;
  remainingCredits: number;
  isPro: boolean;
  isUnauthenticated: boolean;
  setProDialogOpen: (open: boolean) => void;
  setEditingMessageId: (id: string | undefined) => void;
  setText: (text: string) => void;
  setAttachedFiles: (
    files: Array<{ name: string; type: string; size: number; url: string }>
  ) => void;
  setTool: (tool: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  text: string;
  isLoading: boolean;
  tool: string;
  getSubmitStatus: () => "submitted" | undefined;
  shouldShowBanner: boolean;
  canModelUseTools: boolean;
  canModelViewFiles: boolean;
  canSearch: boolean;
  canResearch: boolean;
  remainingSearches: number;
  remainingResearches: number;
  handleFileUpload: (files: FileList | null) => void;
  handleUploadThingComplete: (uploadedFiles: any[]) => void;
}

export const PromptInputComponent: FC<PromptInputComponentProps> = ({
  hasMessages,
  attachedFiles,
  removeAttachedFile,
  editingMessageId,
  remainingCredits,
  isPro,
  isUnauthenticated,
  setProDialogOpen,
  setEditingMessageId,
  setText,
  setAttachedFiles,
  setTool,
  handleSubmit,
  handleTextareaChange,
  text,
  isLoading,
  tool,
  getSubmitStatus,
  shouldShowBanner,
  canModelUseTools,
  canModelViewFiles,
  canSearch,
  canResearch,
  remainingSearches,
  remainingResearches,
  handleFileUpload,
  handleUploadThingComplete,
}) => (
  <div
    className={cn(
      "absolute left-0 right-0 z-10",
      hasMessages ? "bottom-0" : "bottom-1/2"
    )}
  >
    <div className={cn("mx-auto w-full px-3 sm:px-6 py-3 sm:py-4 max-w-3xl")}>
      {attachedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => {
            const isImage = file.type.startsWith("image/");
            if (isImage) {
              return (
                <div key={index} className="relative group">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachedFile(index)}
                    className="absolute -top-2 -right-2 size-6 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              );
            } else {
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm max-w-[200px]"
                >
                  <FileIcon className="size-4" />
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachedFile(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              );
            }
          })}
        </div>
      )}

      {match({
        editingMessageId,
        remainingCredits,
        isPro,
        isUnauthenticated,
      })
        .with(
          {
            isUnauthenticated: true,
            editingMessageId: P.nullish,
          },
          () => (
            <div className="flex justify-between items-center px-3 py-3 bg-sidebar/30 backdrop-blur-md text-xs text-muted-foreground border rounded-t-2xl">
              <div className="flex items-center gap-2">
                <UserIcon className="size-4" />
                <p>Please log in to start chatting</p>
              </div>
              <Button
                variant="link"
                className="h-6 underline font-normal cursor-pointer px-0 text-xs flex items-center gap-1"
                onClick={() => {
                  window.location.href = "/auth";
                }}
              >
                <LogInIcon className="size-3" />
                Sign In
              </Button>
            </div>
          )
        )
        .with(
          {
            remainingCredits: P.number.lte(0),
            isPro: false,
            editingMessageId: P.nullish,
            isUnauthenticated: false,
          },
          () => (
            <div className="flex justify-between items-center px-3 py-3 bg-sidebar/30 backdrop-blur-md text-xs text-muted-foreground  border rounded-t-2xl">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="size-4 " />
                <p>You have no credits remaining.</p>
              </div>
              <Button
                variant="link"
                className="h-6 underline font-normal cursor-pointer px-0 text-xs"
                onClick={() => setProDialogOpen(true)}
              >
                Subscribe now to increase your limits
              </Button>
            </div>
          )
        )
        .with(
          {
            remainingCredits: P.number.lt(18),
            isPro: false,
            editingMessageId: P.nullish,
            isUnauthenticated: false,
          },
          () => (
            <div className="flex justify-between items-center px-3 py-3 border bg-card  w-full border-foreground/10 backdrop-blur-md text-xs text-muted-foreground border-b rounded-t-3xl">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="size-4 " />
                <p>
                  You only have {remainingCredits} credit
                  {remainingCredits === 1 ? "" : "s"} remaining.
                </p>
              </div>
              <Button
                variant="link"
                className="h-6 underline font-normal cursor-pointer px-0 text-xs"
                onClick={() => setProDialogOpen(true)}
              >
                Subscribe now to increase your limits
              </Button>
            </div>
          )
        )
        .with(
          {
            remainingCredits: P.number.lte(0),
            isPro: true,
            editingMessageId: P.nullish,
            isUnauthenticated: false,
          },
          () => (
            <div className="flex justify-between items-center px-3 py-3 bg-card  w-full border-foreground/10 backdrop-blur-md text-xs text-muted-foreground border-b rounded-t-3xl">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="size-4 " />
                <p>You have no credits remaining.</p>
              </div>
              <p className="text-xs text-primary">Resets daily</p>
            </div>
          )
        )
        .with(
          {
            remainingCredits: P.number.lt(10),
            isPro: true,
            editingMessageId: P.nullish,
            isUnauthenticated: false,
          },
          () => (
            <div className="flex justify-between items-center px-3 py-3 bg-card  w-full border-foreground/10 backdrop-blur-md text-xs text-muted-foreground border-b rounded-t-3xl">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="size-4 " />
                <p>
                  You only have {remainingCredits} credit
                  {remainingCredits === 1 ? "" : "s"} remaining.
                </p>
              </div>
              <p className="text-xs text-primary">Resets daily</p>
            </div>
          )
        )
        .with({ editingMessageId: P.string }, () => (
          <div className="flex justify-between items-center px-3 py-3 bg-card   w-full border-foreground/10 backdrop-blur-md text-xs text-muted-foreground border-b rounded-t-3xl ">
            <div className="flex items-center gap-2">
              <EditIcon className="size-4" />
              <p>Editing message</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => {
                setEditingMessageId(undefined);
                setText("");
                setAttachedFiles([]);
                setTool("");
              }}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        ))
        .otherwise(() => null)}

      <PromptInput
        onSubmit={handleSubmit}
        className={cn(
          "p-0 bg-card/80 backdrop-blur-md w-full border-foreground/10 overflow-hidden",
          shouldShowBanner
            ? "rounded-b-3xl rounded-t-none border-t-0"
            : "rounded-3xl",
          !hasMessages && "shadow-lg"
        )}
      >
        <PromptInputAttachments />
        <PromptInputTextarea
          onChange={handleTextareaChange}
          value={text}
          placeholder={
            isUnauthenticated
              ? "Please log in to start chatting..."
              : "Ask me anything..."
          }
          disabled={isLoading || isUnauthenticated}
          className="min-h-[44px] sm:min-h-[52px] text-sm sm:text-base resize-none text-primary"
        />

        <div className="flex items-center px-3 pb-3">
          <div className="flex items-center bg-primary/5 rounded-full p-1 relative h-10">
            <PromptInputAction tooltip="Chat">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                disabled={isUnauthenticated}
                className={cn(
                  "h-8 w-8 rounded-full relative z-10 hover:text-primary",
                  tool === "" && "text-primary",
                  isUnauthenticated && "opacity-50"
                )}
                onClick={() => setTool("")}
              >
                <MessageCircleIcon className="size-4 z-1" />
                {tool === "" && !isUnauthenticated && (
                  <motion.div
                    className="absolute inset-0 h-8 w-full rounded-full bg-background z-0"
                    layoutId="toolThumb"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </Button>
            </PromptInputAction>

            <PromptInputAction
              tooltip={(() => {
                if (isUnauthenticated) return "Please log in to use tools";
                if (!canModelUseTools) return "This model cannot use tools";
                if (remainingSearches <= 0)
                  return "You have reached your search limit";
                if (canSearch) return "Search the web";
                return "Search is not available";
              })()}
            >
              <Button
                variant="ghost"
                size="icon"
                type="button"
                disabled={!canSearch || !canModelUseTools || isUnauthenticated}
                className={cn(
                  "h-8 w-8 rounded-full relative z-10 hover:text-primary",
                  tool === "search" && "text-primary",
                  (!canSearch || !canModelUseTools || isUnauthenticated) &&
                    "opacity-50"
                )}
                onClick={() => {
                  if (isUnauthenticated) {
                    toast.warning("Please log in to use tools");
                    return;
                  }
                  if (!canModelUseTools) {
                    toast.warning("This model cannot use tools");
                    return;
                  }
                  if (remainingSearches <= 0) {
                    toast.warning("You have reached your search limit");
                    return;
                  }
                  if (canSearch) {
                    setTool("search");
                  } else {
                    toast.warning("Search is not available");
                  }
                }}
              >
                <GlobeIcon className="size-4 z-1" />
                {tool === "search" && !isUnauthenticated && (
                  <motion.div
                    className="absolute inset-0 h-8 w-full rounded-full bg-background z-0"
                    layoutId="toolThumb"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </Button>
            </PromptInputAction>

            <PromptInputAction
              tooltip={(() => {
                if (isUnauthenticated) return "Please log in to use tools";
                if (!canModelUseTools) return "This model cannot use tools";
                if (!isPro) return "Research is only available for Pro users";
                if (remainingResearches <= 0)
                  return "You have reached your research limit";
                if (canResearch) return "Deep research";
                return "Deep research is not available";
              })()}
            >
              <Button
                variant="ghost"
                size="icon"
                type="button"
                disabled={
                  !canResearch || !canModelUseTools || isUnauthenticated
                }
                className={cn(
                  "h-8 w-16 rounded-full relative z-10 hover:text-primary",
                  tool === "research" && "text-primary",
                  (!canResearch || !canModelUseTools || isUnauthenticated) &&
                    "opacity-50"
                )}
                onClick={() => {
                  if (isUnauthenticated) {
                    toast.warning("Please log in to use tools");
                    return;
                  }
                  if (!canModelUseTools) {
                    toast.warning("This model cannot use tools");
                    return;
                  }
                  if (!isPro) {
                    toast.warning("Research is only available for Pro users");
                    return;
                  }
                  if (remainingResearches <= 0) {
                    toast.warning("You have reached your research limit");
                    return;
                  }
                  if (canResearch) {
                    setTool("research");
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  <TelescopeIcon className="size-4 z-1" />
                  <span className="text-[8px] font-medium text-primary px-1 py-0.5 rounded-full z-1 bg-primary/10">
                    BETA
                  </span>
                </div>
                {tool === "research" && !isUnauthenticated && (
                  <motion.div
                    className="absolute inset-0 h-8 w-full rounded-full bg-background z-0"
                    layoutId="toolThumb"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </Button>
            </PromptInputAction>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <PromptInputAction
              tooltip={match({ canModelViewFiles, isUnauthenticated })
                .with(
                  { isUnauthenticated: true },
                  () => "Please log in to upload files"
                )
                .with({ canModelViewFiles: true }, () => "Attach files")
                .with(
                  { canModelViewFiles: false },
                  () => "This model does not support file uploads"
                )
                .otherwise(() => "Attach files")}
            >
              <PromptInputFileUpload
                accept="image/*,application/pdf"
                multiple={true}
                onFileSelect={handleFileUpload}
                onUploadComplete={handleUploadThingComplete}
                className={cn(
                  "h-8 w-8 rounded-full",
                  (isUnauthenticated || !canModelViewFiles) && "opacity-50"
                )}
              />
            </PromptInputAction>

            <PromptInputSubmit
              disabled={
                !text.trim() ||
                isLoading ||
                isUnauthenticated ||
                (!isPro && (remainingCredits ?? 0) <= 0)
              }
              status={getSubmitStatus()}
              className="min-h-[36px] sm:min-h-[40px] px-3 sm:px-4 text-xs sm:text-sm rounded-full"
            >
              <ArrowUpIcon className="size-4" />
            </PromptInputSubmit>
          </div>
        </div>
      </PromptInput>
    </div>
  </div>
);
