"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CircularLoader } from "@/components/ui/loader";

const App = dynamic(() => import("../App"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <CircularLoader />
    </div>
  ),
});

export default function ShellPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <CircularLoader />
        </div>
      }
    >
      <App />
    </Suspense>
  );
}
