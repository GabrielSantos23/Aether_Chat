import AppSidebar from "@/components/AppSidebar";
import Header from "@/components/header";
// import ChatInterface from "@/components/ChatInterface";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModelProvider } from "@/contexts/ModelContext";
import { RightSidebar } from "@/components/right-sidebar";
import { useQuery, useConvexAuth } from "convex/react";
import { useSession } from "next-auth/react";
import { api } from "@aether-ai-2/backend/convex/_generated/api";
import { useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/chat/$id")({
  component: ChatComponent,
});

function ChatComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: session, status } = useSession();
  const { isLoading: isConvexLoading, isAuthenticated: isConvexAuthenticated } =
    useConvexAuth();
  const hasConvexToken = !!(session && (session as any).convexToken);
  const isAuthenticated =
    status === "authenticated" && hasConvexToken && isConvexAuthenticated;
  const isSessionLoading = status === "loading" || isConvexLoading;
  const { sidebarVariant } = useTheme();
  const chat = useQuery(
    api.chat.queries.getChat,
    isSessionLoading || !isAuthenticated || !id ? "skip" : { chatId: id as any }
  );

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated && id && chat === null) {
      navigate({ to: "/chat", replace: true });
    }
  }, [chat, id, isAuthenticated, isSessionLoading, navigate]);

  const pageTitle = chat?.title ? `${chat.title}` : "Aether AI | Chat";

  return (
    <ModelProvider>
      <title>{pageTitle}</title>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className={cn(sidebarVariant === "inset" && "border")}>
          <div className="flex flex-col h-screen overflow-hidden ">
            <div className="rounded-md w-full backdrop-blur-sm z-10">
              <Header chatId={id as any} />
            </div>
            <div className="flex-1 overflow-y-hidden">
              {/* <ChatInterface chatId={id as any} /> */}
            </div>
          </div>
        </SidebarInset>
        <RightSidebar />
      </SidebarProvider>
    </ModelProvider>
  );
}
