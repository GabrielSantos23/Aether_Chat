"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { SessionProvider, useSession } from "next-auth/react";
import { useCallback, useMemo } from "react";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { AppThemeProvider } from "@/contexts/theme-context";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useAuthFromNextAuth() {
  const { data: session, status } = useSession();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      const token = (session as any)?.convexToken ?? null;
      return token ?? null;
    },
    [session]
  );

  return useMemo(
    () => ({
      isLoading: status === "loading",
      isAuthenticated:
        status === "authenticated" && !!(session as any)?.convexToken,
      fetchAccessToken,
    }),
    [status, session, fetchAccessToken]
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AppThemeProvider>
          <ConvexProviderWithAuth client={convex} useAuth={useAuthFromNextAuth}>
            <SidebarProvider>{children}</SidebarProvider>
          </ConvexProviderWithAuth>
          <Toaster position="top-center" />
        </AppThemeProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
