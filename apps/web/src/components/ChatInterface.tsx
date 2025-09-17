"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  createContext,
  type FC,
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
import { useRouter } from "next/navigation";

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
  Loader2Icon,
  ArrowUpIcon,
  Paperclip,
  AlertTriangleIcon,
  EditIcon,
  XIcon,
  FileIcon,
  UserIcon,
  LogInIcon,
} from "lucide-react";
import { UserMessage } from "./ai-elements/user-message";
import { AIMessage } from "./ai-elements/ai-message";
import { toast } from "sonner";
import { ProDialog } from "./pro-dialog";
import { PromptInputComponent } from "./PromptInputComponent";

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

// Define props for the extracted component

interface ChatInterfaceProps {
  chatId?: Id<"chats">;
  className?: string;
}

export default function ChatInterface({
  chatId,
  className,
}: ChatInterfaceProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
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

  const isUnauthenticated = status === "unauthenticated" || !session?.user;

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

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
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
    },
    [canModelViewFiles]
  );

  const handleUploadThingComplete = useCallback((uploadedFiles: any[]) => {
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
  }, []);

  const removeAttachedFile = useCallback((index: number) => {
    setAttachedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      const fileToRemove = prev[index];
      if (fileToRemove?.url.startsWith("blob:")) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return newFiles;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
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
          router.push(`/chat/${activeChatId}`);
        }

        await sendMessage({
          chatId: activeChatId,
          message: text.trim(),
          modelId: selectedModelId,
          webSearch: tool === "search",
          imageGen: tool === "image",
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
    },
    [
      text,
      session?.user,
      currentChatId,
      createNewChat,
      sendMessage,
      selectedModelId,
      tool,
      attachedFiles,
      router,
    ]
  );

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

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
    },
    []
  );

  const getSubmitStatus = useCallback(() => {
    if (isLoading) return "submitted";
    return undefined;
  }, [isLoading]);

  const shouldShowBanner = match({
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
      () => true
    )
    .with(
      {
        remainingCredits: P.number.lte(0),
        isPro: false,
        editingMessageId: P.nullish,
        isUnauthenticated: false,
      },
      () => true
    )
    .with(
      {
        remainingCredits: P.number.lt(18),
        isPro: false,
        editingMessageId: P.nullish,
        isUnauthenticated: false,
      },
      () => true
    )
    .with(
      {
        remainingCredits: P.number.lte(0),
        isPro: true,
        editingMessageId: P.nullish,
        isUnauthenticated: false,
      },
      () => true
    )
    .with(
      {
        remainingCredits: P.number.lt(10),
        isPro: true,
        editingMessageId: P.nullish,
        isUnauthenticated: false,
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
          <div className="flex flex-col h-full relative">
            {!hasMessages && !currentChatId && (
              <div className="absolute inset-0 flex flex-col justify-center pb-[40vh] z-0">
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
              <div className="flex-1 overflow-y-auto relative z-0">
                <Conversation className="h-full relative">
                  <ConversationContent className="h-full flex flex-col">
                    <div className="flex-1 mx-auto max-w-3xl w-full px-3 sm:px-6 pb-56 pt-32">
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
                    className="rounded-md absolute bottom-48   right-4 z-30"
                  />
                </Conversation>
              </div>
            )}

            <PromptInputComponent
              hasMessages={hasMessages}
              attachedFiles={attachedFiles}
              removeAttachedFile={removeAttachedFile}
              editingMessageId={editingMessageId}
              remainingCredits={remainingCredits}
              isPro={isPro}
              isUnauthenticated={isUnauthenticated}
              setProDialogOpen={setProDialogOpen}
              setEditingMessageId={setEditingMessageId}
              setText={setText}
              setAttachedFiles={setAttachedFiles}
              setTool={setTool}
              handleSubmit={handleSubmit}
              handleTextareaChange={handleTextareaChange}
              text={text}
              isLoading={isLoading}
              tool={tool}
              getSubmitStatus={getSubmitStatus}
              shouldShowBanner={shouldShowBanner}
              canModelUseTools={canModelUseTools}
              canModelViewFiles={canModelViewFiles}
              canSearch={canSearch}
              canResearch={canResearch}
              remainingSearches={remainingSearches}
              remainingResearches={remainingResearches}
              handleFileUpload={handleFileUpload}
              handleUploadThingComplete={handleUploadThingComplete}
            />
          </div>
        </TooltipProvider>

        <ProDialog open={proDialogOpen} onOpenChange={setProDialogOpen} />
      </div>
    </PromptInputContext.Provider>
  );
}
