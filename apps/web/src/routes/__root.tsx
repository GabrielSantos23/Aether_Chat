import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import "@/index.css";
import Providers from "@/components/providers";
import { useState, useEffect } from "react";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aether AI" },
    ],
    links: [{ rel: "preload", href: "/src/index.css", as: "style" }],
  }),
  component: RootLayout,
});

function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if CSS is loaded by testing if a CSS class is available
    const checkCSSLoaded = () => {
      const testElement = document.createElement("div");
      testElement.className = "antialiased";
      document.body.appendChild(testElement);

      const computedStyle = window.getComputedStyle(testElement);
      const hasStyles = computedStyle.fontFamily !== "serif"; // antialiased should change font

      document.body.removeChild(testElement);

      if (hasStyles) {
        setIsLoading(false);
      } else {
        // Retry after a short delay
        setTimeout(checkCSSLoaded, 50);
      }
    };

    // Start checking after a brief delay to allow CSS to start loading
    setTimeout(checkCSSLoaded, 100);
  }, []);

  if (isLoading) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <HeadContent />
        </head>
        <body className="antialiased">
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
          <Scripts />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <Providers>
          <Outlet />
        </Providers>
        <Scripts />
      </body>
    </html>
  );
}
