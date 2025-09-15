"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../backend/convex/_generated/api";
import type { Id } from "../../../backend/convex/_generated/dataModel";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useModel } from "@/contexts/ModelContext";
import { models } from "@/lib/models";
import { motion } from "framer-motion";
import { match, P } from "ts-pattern";

import {
  PromptInput,
  PromptInputAction,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputAttachments,
  PromptInputFileUpload,
} from "@/components/ai-elements/prompt-input";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  GlobeIcon,
  MicIcon,
  ImageIcon,
  TelescopeIcon,
  MessageCircleIcon,
  BrainIcon,
  Loader2Icon,
  ArrowDown,
  ChevronDown,
  SendIcon,
  ArrowUpIcon,
  Paperclip,
  AlertTriangleIcon,
  EditIcon,
  XIcon,
  FileIcon,
} from "lucide-react";
import { UserMessage } from "./ai-elements/user-message";
import { AIMessage } from "./ai-elements/ai-message";
import { toast } from "sonner";
import { ProDialog } from "./pro-dialog";

const PromptInputContext = createContext<{
  attachedFiles: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  setAttachedFiles: (
    files: Array<{
      name: string;
      type: string;
      size: number;
      url: string;
    }>
  ) => void;
  onFileUpload: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  onUploadThingComplete: (files: any[]) => void;
}>({
  attachedFiles: [],
  setAttachedFiles: () => {},
  onFileUpload: () => {},
  onRemoveFile: () => {},
  onUploadThingComplete: () => {},
});

interface ChatInterfaceProps {
  chatId?: Id<"chats">;
  className?: string;
}

export default function ChatInterface({
  chatId,
  className,
}: ChatInterfaceProps) {
  const { data: session } = useSession();
  const { selectedModelId, setSelectedModelId } = useModel();
  const [text, setText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{
      name: string;
      type: string;
      size: number;
      url: string;
    }>
  >([]);

  const [currentChatId, setCurrentChatId] = useState<Id<"chats"> | null>(
    chatId || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | undefined>(
    undefined
  );
  const [proDialogOpen, setProDialogOpen] = useState(false);

  const [tool, setTool] = useState<string>("");

  const selectedModel = models.find((model) => model.id === selectedModelId);

  const canSearch = !!(
    selectedModel?.toolCalls && selectedModel?.features?.includes("web")
  );
  const canModelUseTools = selectedModel?.toolCalls ?? false;
  const canModelViewFiles =
    selectedModel?.features?.includes("vision") ?? false;
  const remainingSearches = 10;
  const canResearch = selectedModel?.canResearch ?? false;
  const remainingResearches = 5;

  useEffect(() => {
    if (chatId) {
      setCurrentChatId(chatId);
    } else {
      setCurrentChatId(null);
    }
  }, [chatId]);

  useEffect(() => {
    return () => {
      attachedFiles.forEach((file) => {
        if (file.url.startsWith("blob:")) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [attachedFiles]);

  useEffect(() => {
    if (!canModelUseTools && tool !== "") {
      setTool("");
      return;
    }
    if (tool === "search" && !canSearch) {
      setTool("");
      return;
    }
    if (tool === "research" && !canResearch) {
      setTool("");
    }
  }, [canModelUseTools, canSearch, canResearch, tool]);

  const createChat = useMutation(api.chat.mutations.createChat);
  const sendMessage = useAction(api.chat.actions.sendMessage);
  const editMessageAndRegenerate = useAction(
    api.chat.actions.editMessageAndRegenerate
  );
  const messages = useQuery(
    api.chat.queries.getChatMessages,
    currentChatId ? { chatId: currentChatId } : "skip"
  );
  const chat = useQuery(
    api.chat.queries.getChat,
    currentChatId ? { chatId: currentChatId } : "skip"
  );

  const limitsStatus = useQuery(api.limits.getStatus, {} as any);
  const isPro = limitsStatus?.role === "pro";
  const remainingCredits = isPro
    ? Number.POSITIVE_INFINITY
    : limitsStatus?.remaining ?? 0;

  const isError = messages === null && currentChatId;
  const isChatLoading = messages === undefined && currentChatId;
  const isNewChat = !chatId && !currentChatId;
  const hasMessages = messages && messages.length > 0;

  const createNewChat = useCallback(async () => {
    if (!session?.user) return null;

    try {
      const newChatId = await createChat({});
      setCurrentChatId(newChatId);
      return newChatId;
    } catch (error) {
      console.error("Failed to create chat:", error);
      return null;
    }
  }, [createChat, session?.user]);

  const handlePaperclipClick = () => {
    if (!canModelViewFiles) {
      toast.warning("This model does not support file uploads");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (!canModelViewFiles) {
      toast.warning("This model does not support file uploads");
      return;
    }

    const fileArray = Array.from(files);

    const validFiles = fileArray.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      return isImage || isPdf;
    });

    if (validFiles.length !== fileArray.length) {
      toast.warning("Only image and PDF files are supported");
    }

    if (validFiles.length === 0) return;

    const previewFiles = validFiles.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
    }));

    setAttachedFiles((prev) => [...prev, ...previewFiles]);

    toast.success(`${previewFiles.length} file(s) uploaded successfully`);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadThingComplete = (uploadedFiles: any[]) => {
    const files = uploadedFiles.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: file.url,
    }));

    setAttachedFiles((prev) => {
      const newFiles = [...prev, ...files];
      return newFiles;
    });

    toast.success(`${files.length} file(s) uploaded successfully`);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      const fileToRemove = prev[index];
      if (fileToRemove?.url.startsWith("blob:")) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!text.trim() || !session?.user) return;

    setIsLoading(true);

    try {
      let activeChatId = currentChatId;
      if (!activeChatId) {
        activeChatId = await createNewChat();
        if (!activeChatId) {
          throw new Error("Failed to create chat");
        }
      }

      await sendMessage({
        chatId: activeChatId,
        message: text.trim(),
        modelId: selectedModelId,
        webSearch: tool === "search",
        imageGen: false,
        research: tool === "research",
        attachments: attachedFiles,
      });

      setText("");
      setAttachedFiles([]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserMessageEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setText(content);
  };

  const handleAIMessageRegenerate = async (messageIndex: number) => {
    if (!messages) return;

    try {
      let previousUserMessage: any | null = null;
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          previousUserMessage = messages[i];
          break;
        }
      }

      if (!previousUserMessage) return;

      await editMessageAndRegenerate({
        messageId: previousUserMessage._id,
        content: previousUserMessage.content,
        modelId: selectedModelId,
        webSearch: tool === "search",
      });
    } catch (err) {
      console.error("Regenerate failed", err);
      toast.error("Failed to regenerate message");
    }
  };

  const getSubmitStatus = () => {
    if (isLoading) return "submitted";
    return undefined;
  };

  const shouldShowBanner = match({ editingMessageId, remainingCredits, isPro })
    .with(
      {
        remainingCredits: P.number.lte(0),
        isPro: false,
        editingMessageId: P.nullish,
      },
      () => true
    )
    .with(
      {
        remainingCredits: P.number.lt(18),
        isPro: false,
        editingMessageId: P.nullish,
      },
      () => true
    )
    .with(
      {
        remainingCredits: P.number.lte(0),
        isPro: true,
        editingMessageId: P.nullish,
      },
      () => true
    )
    .with(
      {
        remainingCredits: P.number.lt(10),
        isPro: true,
        editingMessageId: P.nullish,
      },
      () => true
    )
    .with({ editingMessageId: P.string }, () => true)
    .otherwise(() => false);

  if (isChatLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2Icon className="size-4 animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4 text-sm">
              Loading chat...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError && !isNewChat) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h3 className="text-lg sm:text-xl font-semibold text-destructive">
              Chat not found
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              This chat may have been deleted or you don't have access to it.
            </p>
            <button
              onClick={() => (window.location.href = "/chat")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 mt-4 text-sm"
            >
              Start a new chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PromptInputContext.Provider
      value={{
        attachedFiles,
        setAttachedFiles,
        onFileUpload: handleFileUpload,
        onRemoveFile: removeAttachedFile,
        onUploadThingComplete: handleUploadThingComplete,
      }}
    >
      <div className={cn("flex flex-col h-full", className)}>
        <TooltipProvider>
          <div
            className={cn({
              "flex flex-col h-full": hasMessages,
              "absolute inset-0 flex flex-col justify-center": !hasMessages,
              "pb-[30vh]": !hasMessages,
            })}
          >
            {!hasMessages && !currentChatId && (
              <div className="mb-6">
                <motion.div
                  className="max-w-3xl mx-auto font-serif text-center px-3 sm:px-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl mb-4">
                    Hello, {session?.user?.name || "there"}!
                  </h2>
                </motion.div>
              </div>
            )}
            {hasMessages && (
              <div className="flex-1 overflow-y-auto">
                <Conversation className="h-full">
                  <ConversationContent className="h-full flex flex-col">
                    <div className="flex-1 mx-auto max-w-3xl w-full px-3 sm:px-6">
                      {messages.map((message: any, index: number) => {
                        if (message.role === "user") {
                          return (
                            <UserMessage
                              key={message._id}
                              message={message}
                              onEdit={handleUserMessageEdit}
                            />
                          );
                        } else {
                          let hasPreviousUserMessage = false;
                          for (let i = index - 1; i >= 0; i--) {
                            if (messages[i].role === "user") {
                              hasPreviousUserMessage = true;
                              break;
                            }
                          }
                          return (
                            <AIMessage
                              key={message._id}
                              message={message}
                              onRegenerate={() =>
                                handleAIMessageRegenerate(index)
                              }
                              canRegenerate={hasPreviousUserMessage}
                            />
                          );
                        }
                      })}
                    </div>
                  </ConversationContent>
                  <ConversationScrollButton
                    variant="default"
                    className="rounded-md"
                  />
                </Conversation>
              </div>
            )}

            <div
              className={cn(
                "w-full px-3 sm:px-6 py-3 sm:py-4",
                hasMessages && "mx-auto max-w-3xl border-t sm:border-t-0",
                !hasMessages && "mx-auto max-w-4xl"
              )}
            >
              {attachedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => {
                    const isImage = file.type.startsWith("image/");
                    const isPdf = file.type === "application/pdf";

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

              {match({ editingMessageId, remainingCredits, isPro })
                .with(
                  {
                    remainingCredits: P.number.lte(0),
                    isPro: false,
                    editingMessageId: P.nullish,
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
                  },
                  () => (
                    <div className="flex justify-between items-center px-3 py-3 bg-muted/30  w-full border-foreground/10 backdrop-blur-md text-xs text-muted-foreground border-b rounded-t-3xl">
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
                  },
                  () => (
                    <div className="flex justify-between items-center px-3 py-3 bg-muted/30  w-full border-foreground/10 backdrop-blur-md text-xs text-muted-foreground border-b rounded-t-3xl">
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
                  },
                  () => (
                    <div className="flex justify-between items-center px-3 py-3 bg-muted/30  w-full border-foreground/10 backdrop-blur-md text-xs text-muted-foreground border-b rounded-t-3xl">
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
                  <div className="flex justify-between items-center px-3 py-3 bg-muted/30  w-full border-foreground/10 backdrop-blur-md text-xs text-muted-foreground border-b rounded-t-3xl">
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
                  "p-0 bg-muted/50 backdrop-blur-md w-full border-foreground/10 overflow-hidden",
                  shouldShowBanner
                    ? "rounded-b-3xl rounded-t-none border-t-0"
                    : "rounded-3xl",
                  !hasMessages && "shadow-lg"
                )}
              >
                <PromptInputAttachments />
                <PromptInputTextarea
                  onChange={(e) => setText(e.target.value)}
                  value={text}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="min-h-[44px] sm:min-h-[52px] text-sm sm:text-base resize-none"
                />

                <div className="flex items-center px-3 pb-3">
                  <div className="flex items-center bg-primary/5 rounded-full p-1 relative h-10">
                    <PromptInputAction tooltip="Chat">
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className={cn(
                          "h-8 w-8 rounded-full relative z-10 hover:text-primary",
                          tool === "" && "text-primary"
                        )}
                        onClick={() => setTool("")}
                      >
                        <MessageCircleIcon className="size-4 z-1" />
                        {tool === "" && (
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
                        if (!canModelUseTools)
                          return "This model cannot use tools";
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
                        disabled={!canSearch || !canModelUseTools}
                        className={cn(
                          "h-8 w-8 rounded-full relative z-10 hover:text-primary",
                          tool === "search" && "text-primary",
                          (!canSearch || !canModelUseTools) && "opacity-50"
                        )}
                        onClick={() => {
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
                        {tool === "search" && (
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
                        if (!canModelUseTools)
                          return "This model cannot use tools";
                        if (!isPro)
                          return "Research is only available for Pro users";
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
                        disabled={!canResearch || !canModelUseTools}
                        className={cn(
                          "h-8 w-16 rounded-full relative z-10 hover:text-primary",
                          tool === "research" && "text-primary",
                          (!canResearch || !canModelUseTools) && "opacity-50"
                        )}
                        onClick={() => {
                          if (!canModelUseTools) {
                            toast.warning("This model cannot use tools");
                            return;
                          }
                          if (!isPro) {
                            toast.warning(
                              "Research is only available for Pro users"
                            );
                            return;
                          }
                          if (remainingResearches <= 0) {
                            toast.warning(
                              "You have reached your research limit"
                            );
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
                        {tool === "research" && (
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
                      tooltip={match({ canModelViewFiles })
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
                        className="h-8 w-8 rounded-full"
                      />
                    </PromptInputAction>

                    <PromptInputSubmit
                      disabled={
                        !text.trim() ||
                        isLoading ||
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
        </TooltipProvider>

        <ProDialog open={proDialogOpen} onOpenChange={setProDialogOpen} />
      </div>
    </PromptInputContext.Provider>
  );
}
