import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "./ui/sidebar";
import { Loader2Icon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Fragment, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipPositioner,
  TooltipTrigger,
} from "./ui/tooltip";
import { useQuery, useMutation } from "convex/react";
import { api } from "@aether-ai-2/backend/convex/_generated/api";
import type { Id } from "@aether-ai-2/backend/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import AetheriaIcon from "./icons/Aether";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

type Chat = {
  _id: Id<"chats">;
  userId: Id<"users">;
  title: string;
  createdAt: number;
  updatedAt: number;
  shareId?: string;
  isShared?: boolean;
  isGeneratingTitle?: boolean;
  isBranch?: boolean;
  isPinned?: boolean;
};

export default function AppSidebar() {
  const [chatToEdit, setChatToEdit] = useState<Chat | null>(null);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const { sidebarVariant, isLoading } = useTheme();

  if (isLoading) {
    return null;
  }

  return (
    <Sidebar variant={sidebarVariant} key={sidebarVariant}>
      <AppSidebarHeader />
      <SidebarContent>
        <AppSidebarActions />
        <AppSidebarChats
          setChatToEdit={setChatToEdit}
          setChatToDelete={setChatToDelete}
        />
      </SidebarContent>
      <EditChatTitleDialog chat={chatToEdit} setChatToEdit={setChatToEdit} />
      <DeleteChatDialog chat={chatToDelete} setChatToDelete={setChatToDelete} />
    </Sidebar>
  );
}

function AppSidebarHeader() {
  const { sidebarVariant, isLoading } = useTheme();

  return (
    <SidebarHeader
      className={cn("p-3 py-4  ", sidebarVariant === "sidebar" && "border-b")}
    >
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <AetheriaIcon className="size-15" />
          </Link>
        </Button>
        <SidebarTrigger />
      </div>
    </SidebarHeader>
  );
}

function AppSidebarActions() {
  const createChat = useMutation(api.chat.mutations.createChat);
  const navigate = useNavigate();

  const handleNewChat = async () => {
    try {
      navigate(`/chat`);
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <Link
            to="/chat"
            className="flex items-center gap-x-3 hover:bg-accent px-2 py-2 text-muted-foreground hover:text-foreground rounded-md transition-all duration-150 "
          >
            <PlusIcon className="size-5" />
            <span className="flex-1">New Chat</span>
          </Link>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function AppSidebarChats({
  setChatToEdit,
  setChatToDelete,
}: {
  setChatToEdit: (chat: Chat | null) => void;
  setChatToDelete: (chat: Chat | null) => void;
}) {
  const { data: session, status } = useSession();
  const hasConvexToken = !!(session && (session as any).convexToken);
  const isAuthenticated = status === "authenticated" && hasConvexToken;

  // Add session loading check
  const isSessionLoading = status === "loading";

  const chats = useQuery(
    api.chat.queries.getUserChats,
    isSessionLoading || !isAuthenticated ? "skip" : {}
  );

  // Show loading during session loading
  if (isSessionLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Loader2Icon className="size-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!chats) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Loader2Icon className="size-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Loading chats...
          </span>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground/50">
          No chats yet. Create your first chat to get started.
        </p>
      </div>
    );
  }

  const groups = groupChatsByTimeRange(chats);

  return (
    <Fragment>
      {groups.today.length > 0 && (
        <ChatGroup
          chats={groups.today}
          label="Today"
          setChatToEdit={setChatToEdit}
          setChatToDelete={setChatToDelete}
        />
      )}
      {groups.yesterday.length > 0 && (
        <ChatGroup
          chats={groups.yesterday}
          label="Yesterday"
          setChatToEdit={setChatToEdit}
          setChatToDelete={setChatToDelete}
        />
      )}
      {groups.lastThirtyDays.length > 0 && (
        <ChatGroup
          chats={groups.lastThirtyDays}
          label="Last 30 Days"
          setChatToEdit={setChatToEdit}
          setChatToDelete={setChatToDelete}
        />
      )}
      {groups.history.length > 0 && (
        <ChatGroup
          chats={groups.history}
          label="History"
          setChatToEdit={setChatToEdit}
          setChatToDelete={setChatToDelete}
        />
      )}
      <p className="text-sm text-muted-foreground/50 p-4">
        You've reached the end of your chats.
      </p>
    </Fragment>
  );
}

function groupChatsByTimeRange(chats: Chat[]) {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = yesterday.getTime();

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStart = thirtyDaysAgo.getTime();

  return {
    today: chats.filter((chat) => chat.updatedAt >= todayStart),
    yesterday: chats.filter(
      (chat) => chat.updatedAt >= yesterdayStart && chat.updatedAt < todayStart
    ),
    lastThirtyDays: chats.filter(
      (chat) =>
        chat.updatedAt >= thirtyDaysAgoStart && chat.updatedAt < yesterdayStart
    ),
    history: chats.filter((chat) => chat.updatedAt < thirtyDaysAgoStart),
  };
}

function ChatGroup({
  chats,
  label,
  setChatToEdit,
  setChatToDelete,
}: {
  chats: Chat[];
  label: string;
  setChatToEdit: (chat: Chat) => void;
  setChatToDelete: (chat: Chat) => void;
}) {
  if (chats.length === 0) return null;
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {chats.map((chat) => (
            <ChatItem
              key={chat._id}
              chat={chat}
              setChatToEdit={setChatToEdit}
              setChatToDelete={setChatToDelete}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function ChatItem({
  chat,
  setChatToEdit,
  setChatToDelete,
}: {
  chat: Chat;
  setChatToEdit: (chat: Chat) => void;
  setChatToDelete: (chat: Chat) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const deleteChat = useMutation(api.chat.mutations.deleteChat);
  const renameChat = useMutation(api.chat.mutations.renameChat);

  const handleDelete = () => {
    setChatToDelete(chat);
  };

  const handleEdit = () => {
    setChatToEdit(chat);
  };

  const chatId = String(chat._id);
  const isSelected =
    location.pathname === `/chat/${chatId}` ||
    location.pathname.startsWith(`/chat/${chatId}/`);

  const selectedBg = "bg-muted dark:bg-muted/60";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <div
          className={`group/chat-item relative ${isSelected ? selectedBg : ""}`}
        >
          <Link
            to={`/chat/${chat._id}`}
            className={`w-full flex absolute inset-0 items-center px-2 rounded-md gap-2 ${
              isSelected ? "pointer-events-none" : ""
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.button === 0) {
                navigate(`/chat/${chat._id}`);
              }
            }}
            tabIndex={isSelected ? -1 : 0}
            aria-current={isSelected ? "page" : undefined}
          >
            <span className="truncate flex-1">{chat.title}</span>
            {chat.isGeneratingTitle && (
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            )}
          </Link>
          <div className="absolute top-0 right-0 bottom-0 pointer-events-none flex justify-end gap-2 px-4 items-center group-hover/chat-item:opacity-100 opacity-0 transition-all duration-100 bg-gradient-to-l from-sidebar to-transparent w-full rounded-r-md" />
          <div className="absolute top-0 right-0 bottom-0 flex justify-end gap-2 px-2 items-center group-hover/chat-item:opacity-100 group-hover/chat-item:translate-x-0 translate-x-full opacity-0 transition-all duration-100 rounded-r-lg pointer-events-none group-hover/chat-item:pointer-events-auto">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 hover:text-primary hover:bg-transparent"
                    onClick={handleEdit}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                }
              />
              <TooltipPositioner className="pointer-events-none">
                <TooltipContent>Edit Chat Title</TooltipContent>
              </TooltipPositioner>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 hover:text-primary"
                    onClick={handleDelete}
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                }
              />
              <TooltipPositioner className="pointer-events-none">
                <TooltipContent>Delete Chat</TooltipContent>
              </TooltipPositioner>
            </Tooltip>
          </div>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function EditChatTitleDialog({
  chat,
  setChatToEdit,
}: {
  chat: Chat | null;
  setChatToEdit: (chat: Chat | null) => void;
}) {
  const [title, setTitle] = useState(chat?.title ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const renameChat = useMutation(api.chat.mutations.renameChat);

  useEffect(() => {
    if (chat) {
      setTitle(chat.title);
    }
  }, [chat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chat || !title.trim() || title === chat.title) {
      setChatToEdit(null);
      return;
    }

    setIsSubmitting(true);
    try {
      await renameChat({ chatId: chat._id, title: title.trim() });
      setChatToEdit(null);
    } catch (error) {
      console.error("Failed to rename chat:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!chat} onOpenChange={() => setChatToEdit(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Chat Title</DialogTitle>
          <DialogDescription>
            Enter a new title for this chat.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter chat title..."
                maxLength={100}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setChatToEdit(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || title === chat?.title || isSubmitting}
            >
              {isSubmitting && (
                <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
              )}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteChatDialog({
  chat,
  setChatToDelete,
}: {
  chat: Chat | null;
  setChatToDelete: (chat: Chat | null) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteChat = useMutation(api.chat.mutations.deleteChat);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDelete = async () => {
    if (!chat) return;

    setIsDeleting(true);
    try {
      await deleteChat({ chatId: chat._id });

      // Check if we're currently viewing the chat being deleted
      const chatId = String(chat._id);
      const isCurrentlyViewingChat =
        location.pathname === `/chat/${chatId}` ||
        location.pathname.startsWith(`/chat/${chatId}/`);

      if (isCurrentlyViewingChat) {
        // Navigate away immediately to prevent the ChatInterface from continuing to query
        navigate("/chat", { replace: true });
      }

      setChatToDelete(null);
    } catch (error) {
      console.error("Failed to delete chat:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={!!chat} onOpenChange={() => setChatToDelete(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Chat</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{chat?.title}"? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setChatToDelete(null)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && (
              <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
