"use client";

import { useState, useCallback, useEffect, useRef, createContext } from "react";
import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "@backend/convex/_generated/api";
import type { Id } from "@backend/convex/_generated/dataModel";
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
import { VirtualizedMessageList } from "@/components/ai-elements/virtualized-message-list";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Loader2Icon } from "lucide-react";
import { AIMessage } from "./ai-elements/ai-message";
import { toast } from "sonner";
import { ProDialog } from "./pro-dialog";
import { PromptInputComponent } from "./PromptInputComponent";
import { ChatSuggestions } from "./ai-elements/ChatSuggestions";
import { UserMessage } from "./ai-elements/user-message";
import { type UploadedFile, type Message as MessageType } from "@/lib/types";

const PromptInputContext = createContext<{
  attachedFiles: Array<
    UploadedFile & {
      isUploading?: boolean;
      uploadProgress?: number;
    }
  >;
  setAttachedFiles: (
    files: Array<
      UploadedFile & {
        isUploading?: boolean;
        uploadProgress?: number;
      }
    >
  ) => void;
  onFileUpload: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  onUploadThingComplete: (files: UploadedFile[]) => void;
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
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isLoading: isConvexLoading, isAuthenticated: isConvexAuthenticated } =
    useConvexAuth();
  const { selectedModelId } = useModel();
  const [text, setText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<
    Array<
      UploadedFile & {
        isUploading?: boolean;
        uploadProgress?: number;
      }
    >
  >([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const hasConvexToken = !!(session && (session as any).convexToken);
  const isAuthenticated =
    status === "authenticated" &&
    !!session?.user &&
    hasConvexToken &&
    isConvexAuthenticated;

  const isSessionLoading = status === "loading" || isConvexLoading;
  const shouldSkipQueries =
    isSessionLoading || !isAuthenticated || !currentChatId;

  const chat = useQuery(
    api.chat.queries.getChat,
    shouldSkipQueries ? "skip" : { chatId: currentChatId }
  );

  const shouldSkipMessages =
    shouldSkipQueries || chat === undefined || chat === null;

  const messages = useQuery(
    api.chat.queries.getChatMessages,
    shouldSkipMessages ? "skip" : { chatId: currentChatId }
  );

  useEffect(() => {
    if (
      !isSessionLoading &&
      isAuthenticated &&
      currentChatId &&
      chat === null
    ) {
      router.push("/chat");
    }
  }, [chat, currentChatId, isAuthenticated, isSessionLoading, router]);

  const limitsStatus = useQuery(
    api.limits.getStatus,
    isSessionLoading || !isAuthenticated ? "skip" : ({} as any)
  );

  const isPro = limitsStatus?.role === "pro";
  const remainingCredits = isPro
    ? Number.POSITIVE_INFINITY
    : limitsStatus?.remaining ?? 0;

  const isError =
    (messages === null || chat === null) && currentChatId && !isSessionLoading;
  const isChatLoading =
    ((messages === undefined || chat === undefined) && currentChatId) ||
    isSessionLoading;
  const isNewChat = !chatId && !currentChatId;
  const hasMessages = (messages?.length ?? 0) > 0;
  const safeMessages = messages ?? [];

  // Use virtualization for large message lists (threshold: 50 messages)
  const shouldUseVirtualization = safeMessages.length > 50;

  const chatDeleted = currentChatId && chat === null && !isSessionLoading;

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
        return isImage;
      });

      if (validFiles.length !== fileArray.length) {
        toast.warning(
          "Only image files are currently supported. PDF and text file support is coming soon!"
        );
      }

      if (validFiles.length === 0) return;

      setIsUploading(true);

      const previewFiles = validFiles.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        key: `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isUploading: true,
        uploadProgress: 0,
      }));

      setAttachedFiles((prev) => [...prev, ...previewFiles]);

      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setAttachedFiles((prev) =>
          prev.map((file, index) =>
            index >= prev.length - previewFiles.length
              ? { ...file, uploadProgress: i }
              : file
          )
        );
      }

      setAttachedFiles((prev) =>
        prev.map((file, index) =>
          index >= prev.length - previewFiles.length
            ? { ...file, isUploading: false, uploadProgress: 100 }
            : file
        )
      );

      setIsUploading(false);
      toast.success(`${previewFiles.length} file(s) uploaded successfully`);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [canModelViewFiles]
  );

  const handleUploadThingComplete = useCallback(
    (uploadedFiles: UploadedFile[]) => {
      const files = uploadedFiles
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          url: file.url,
          key: file.key,
          isUploading: false,
          uploadProgress: 100,
        }));

      if (files.length === 0) {
        toast.warning("Only image files are supported");
        return;
      }

      setAttachedFiles((prev) => {
        const newFiles = [...prev, ...files];
        return newFiles;
      });

      toast.success(`${files.length} file(s) uploaded successfully`);
    },
    []
  );

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

  const handleUserMessageEdit = useCallback(
    (messageId: string, content: string) => {
      setEditingMessageId(messageId);
      setText(content);
    },
    []
  );

  const handleAIMessageRegenerate = useCallback(
    async (messageIndex: number) => {
      if (!safeMessages.length) return;

      try {
        let previousUserMessage: MessageType | null = null;
        for (let i = messageIndex - 1; i >= 0; i--) {
          if (safeMessages[i].role === "user") {
            previousUserMessage = safeMessages[i];
            break;
          }
        }

        if (!previousUserMessage) return;

        await editMessageAndRegenerate({
          messageId: previousUserMessage._id as Id<"messages">,
          content: previousUserMessage.content,
          modelId: selectedModelId,
          webSearch: tool === "search",
        });
      } catch (err) {
        console.error("Regenerate failed", err);
        toast.error("Failed to regenerate message");
      }
    },
    [safeMessages, editMessageAndRegenerate, selectedModelId, tool]
  );

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

  const handleSuggestionPick = useCallback(
    (suggestedText: string, suggestedTool?: string) => {
      if (suggestedTool) setTool(suggestedTool);
      setText(suggestedText);
    },
    []
  );

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

  if (isSessionLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2Icon className="size-4 animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isChatLoading && !isSessionLoading) {
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

  if ((isError || chatDeleted) && !isNewChat) {
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
              onClick={() => router.push("/chat")}
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
                      {shouldUseVirtualization ? (
                        <VirtualizedMessageList
                          messages={safeMessages}
                          onUserMessageEdit={handleUserMessageEdit}
                          onAIMessageRegenerate={handleAIMessageRegenerate}
                          className="h-full"
                        />
                      ) : (
                        safeMessages.map(
                          (message: MessageType, index: number) => {
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
                                if (safeMessages[i].role === "user") {
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
                          }
                        )
                      )}
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
              setAttachedFiles={(files) => setAttachedFiles(files)}
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
              isUploading={isUploading}
            />

            {!hasMessages && !currentChatId && (
              <div className="absolute left-0 right-0 top-1/2  z-0">
                <ChatSuggestions
                  tool={tool}
                  isUnauthenticated={isUnauthenticated}
                  canModelUseTools={canModelUseTools}
                  canSearch={canSearch}
                  canResearch={canResearch}
                  remainingSearches={remainingSearches}
                  remainingResearches={remainingResearches}
                  onPick={handleSuggestionPick}
                />
              </div>
            )}
          </div>
        </TooltipProvider>

        <ProDialog open={proDialogOpen} onOpenChange={setProDialogOpen} />
      </div>
    </PromptInputContext.Provider>
  );
}
