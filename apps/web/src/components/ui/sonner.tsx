import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }: any) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as any}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--sidebar)",
          "--normal-text": "var(--sidebar-foreground)",
          "--normal-border": "var(--border)",
        } as any
      }
      {...props}
    />
  );
};

export { Toaster };
