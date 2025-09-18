import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { memo } from "react";

export const UrlResultButton = memo(function PureUrlResultButton({
  urls,
  count,
  label,
  className,
  toolCalls,
}: {
  urls: string[];
  count: number;
  label: string;
  className?: string;
  toolCalls?: Array<{
    toolName: string;
    result?: unknown;
    args?: { query?: string };
  }>;
}) {
  const { openSearchSidebar, closeSidebar, isOpen } = useSidebar();

  const searchToolCalls =
    toolCalls?.filter((tc) => tc.toolName === "webSearch") || [];

  if (searchToolCalls.length === 0) {
    return null;
  }

  const searchCall = searchToolCalls[0];
  const hasResult = searchCall?.result !== undefined;
  const hasNonEmptyArrayResult = Array.isArray(searchCall?.result)
    ? searchCall.result.length > 0
    : false;
  const isDone =
    hasResult && (hasNonEmptyArrayResult || !Array.isArray(searchCall?.result));
  const searchResults =
    isDone && Array.isArray(searchCall?.result) ? searchCall.result : [];
  const query = searchCall?.args?.query || "Search";

  const handleClick = () => {
    if (isOpen) {
      closeSidebar();
    } else {
      openSearchSidebar(searchResults, query);
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "flex p-2 bg-sidebar rounded-3xl gap-3 items-center cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      <div className="flex -space-x-2">
        {urls.slice(0, 5).map((url, index) => {
          let hostname = "example.com";
          try {
            const urlObj = new URL(url);
            hostname = urlObj.hostname || "example.com";
          } catch {
            hostname = "example.com";
          }
          return (
            <img
              key={`${url}-${index}`}
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
              alt={`${hostname} favicon`}
              className="w-5 h-5 rounded-full"
              onError={(e) => {
                e.currentTarget.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' y1='8' x2='12' y2='16'/%3E%3Cline x1='8' y1='12' x2='16' y2='12'/%3E%3C/svg%3E";
              }}
            />
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground pr-2 group-hover:text-foreground transition-colors duration-200">
        {count} {label}
      </span>
    </button>
  );
});
