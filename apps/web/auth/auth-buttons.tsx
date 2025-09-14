"use client";

import { AuthProviderIcon } from "@/components/icons/provider-icon";
import { Button } from "@/components/ui/button";
import { CircularLoader } from "@/components/ui/loader";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { useState } from "react";

interface AuthButtonsProps {
  providers: {
    name: string;
    id: string;
  }[];
  redirect?: string;
}

export const AuthButtons = ({ providers, redirect }: AuthButtonsProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          className="w-full"
          disabled={isLoading !== null}
          onClick={async () => {
            setIsLoading(provider.id);
            try {
              await nextAuthSignIn(provider.id, {
                callbackUrl: redirect || "/",
              });
            } catch (error) {
              console.error("Authentication error:", error);
              setIsLoading(null);
            }
          }}
        >
          {isLoading === provider.id ? (
            <CircularLoader size="sm" />
          ) : (
            <AuthProviderIcon provider={provider.name} />
          )}
          Sign in with {provider.name}
        </Button>
      ))}
    </div>
  );
};
