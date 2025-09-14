"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { SidebarProvider } from "@/contexts/sidebar-context";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session && "convexToken" in session && session.convexToken) {
      convex.setAuth(() => Promise.resolve(session.convexToken as string));
    } else {
      convex.clearAuth();
    }
  }, [session]);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ConvexClientProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ConvexClientProvider>
        <Toaster position="top-center" />
      </ThemeProvider>
    </SessionProvider>
  );
}
