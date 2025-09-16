import AppSidebar from "@/components/AppSidebar";
import Header from "@/components/header";
import ChatInterface from "@/components/ChatInterface";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModelProvider } from "@/contexts/ModelContext";
import { useParams } from "react-router-dom";
import { RightSidebar } from "@/components/right-sidebar";

export default function Chat() {
  const { id } = useParams<{ id?: string }>();

  return (
    <ModelProvider>
      <title>Aether AI | Chat</title>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col h-screen overflow-hidden">
            <div className=" rounded-md  w-full  backdrop-blur-sm z-10">
              <Header />
            </div>
            <div className="flex-1 overflow-y-hidden">
              <ChatInterface chatId={id as any} />
            </div>
          </div>
        </SidebarInset>
        <RightSidebar />
      </SidebarProvider>
    </ModelProvider>
  );
}
