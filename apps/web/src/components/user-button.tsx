import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LogOut,
  User,
  Settings,
  CreditCard,
  Bot,
  Paintbrush,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../backend/convex/_generated/api";

interface UserButtonProps {
  user?: {
    id: string;
    email: string;
    fullName?: string;
    avatar?: string;
  };
  onSignOut?: () => void;
  onSignIn?: () => void;
  className?: string;
  isPro?: boolean;
}

interface NormalizedUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export function UserButton({
  user,
  onSignOut,
  onSignIn,
  className,
  isPro = false,
}: UserButtonProps) {
  const { data: session, status, update } = useSession();
  const convexUser = useQuery(api.myFunctions.getUser);

  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut({
        redirect: false,
      });
      onSignOut?.();
      navigate("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
      onSignOut?.();
      navigate("/");
    }
  };

  if (status === "loading") {
    return (
      <Button variant="outline" disabled className={className}>
        Loading...
      </Button>
    );
  }

  const normalizeUser = (): NormalizedUser | null => {
    if (user) {
      return {
        id: user.id,
        email: user.email || "",
        name: user.fullName || undefined,
        image: user.avatar || undefined,
      };
    }

    if (convexUser) {
      return {
        id: convexUser._id,
        email: convexUser.email,
        name: convexUser.name,
        image: convexUser.image,
      };
    }

    if (session?.user) {
      return {
        id: session.user.email || "",
        email: session.user.email || "",
        name: session.user.name,
        image: session.user.image,
      };
    }

    return null;
  };

  const currentUser = normalizeUser();

  if (!currentUser) {
    const handleSignIn = () => {
      if (onSignIn) return onSignIn();
      navigate("/login");
    };
    return (
      <Button variant="outline" onClick={handleSignIn} className={className}>
        Sign In
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-md overflow-hidden border border-muted hover:border-muted-foreground",
            className
          )}
        >
          {currentUser.image ? (
            <img
              src={currentUser.image}
              alt={currentUser.name || currentUser.email || "User"}
              className="h-full w-full object-cover rounded-none"
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium rounded-none">
              {currentUser.name?.[0] ||
                currentUser.email?.[0]?.toUpperCase() ||
                "U"}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0 bg-background/50 border-foreground/10 backdrop-blur-md"
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b border-foreground/10">
          <div className="flex flex-col overflow-hidden">
            <div className="text-sm truncate">{currentUser.name || "User"}</div>
            <div className="text-xs text-muted-foreground truncate">
              {isPro ? "Pro" : "Free"}
            </div>
          </div>
        </div>

        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-accent"
            asChild
          >
            <Link to="/account">
              <User className="h-4 w-4 mr-2" />
              Account
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-accent"
            asChild
          >
            <Link to="/account/subscription">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscription
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-accent"
            asChild
          >
            <Link to="/account/preferences">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-accent"
            asChild
          >
            <Link to="/account/models">
              <Bot className="h-4 w-4 mr-2" />
              Models
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-accent"
            asChild
          >
            <Link to="/account/appearance">
              <Paintbrush className="h-4 w-4 mr-2" />
              Appearance
            </Link>
          </Button>

          <div className="border-t border-foreground/10 my-2" />

          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-accent"
            asChild
          >
            <a
              href="https://github.com/aether-ai/aether-ai"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </a>
          </Button>

          <div className="border-t border-foreground/10 my-2" />

          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-accent"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const signOutFunction = async () => {
  try {
    await signOut({
      redirect: false,
    });
  } catch (error) {
    console.error("Failed to sign out:", error);
  }
};
