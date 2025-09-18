import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/use-theme";
import { Mail, Loader2, CheckCircle, Github } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// import { AuthButtons } from "@/auth/auth-buttons";
import { FcGoogle } from "react-icons/fc";
import { CircularLoader } from "@/components/ui/loader";
import { MagicLink } from "@/components/Magic-Link";
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormData = z.infer<typeof emailSchema>;

const LoginPage = () => {
  const { isLoading: themeLoading } = useTheme();
  const { data: session, status } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [, setIsSubmitting] = useState(false);

  const [socialLoading, setSocialLoading] = useState<
    null | "google" | "github"
  >(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  useEffect(() => {
    const urlError = searchParams.get("error");
    const urlSuccess = searchParams.get("success");
    const email = searchParams.get("email");

    if (urlError) {
      setError(getErrorMessage(urlError));
    }
    if (urlSuccess && email) {
      setSuccess(`Successfully signed in with ${email}`);
      setTimeout(() => {
        navigate("/chat");
      }, 2000);
    }
  }, [searchParams, navigate]);

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "InvalidLink":
        return "Invalid or expired magic link";
      case "VerificationFailed":
        return "Email verification failed";
      default:
        return "An error occurred during sign in";
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      setIsLoading(true);
      setIsSubmitting(true);
      setError(null);

      const result = await signIn("email", {
        email,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      setEmailSent(true);
      setSuccess(
        "Magic link sent! Check your email and click the link to sign in."
      );
    } catch (error) {
      console.error("Magic link error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send magic link"
      );
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: EmailFormData) => {
    sendMagicLink(data.email);
  };

  const handleSocialSignIn = async (provider: "google" | "github") => {
    setSocialLoading(provider);
    try {
      await signIn(provider);
    } finally {
    }
  };

  if (status === "loading" || themeLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (session) {
    navigate("/chat");
    return null;
  }

  if (emailSent) {
    return <MagicLink />;
  }

  // const providers = [
  //   { name: "Google", id: "google" },
  //   { name: "GitHub", id: "github" },
  // ].filter(Boolean);

  return (
    <div className="flex flex-1 items-center justify-center relative w-full p-4 h-screen">
      {!session && (
        <>
          <div className="flex flex-col gap-6 items-center max-w-md col-span-1 justify-center row-span-3 rounded-2xl">
            <div className="flex flex-col items-center gap-2 min-w-[200px] md:min-w-[350px]">
              <h2 className="text-xl font-semibold text-foreground">
                Login to Aether
              </h2>
              <span className="text-muted-foreground text-sm">
                Enter your email to receive a magic link
              </span>
            </div>

            {error && (
              <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="w-full p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="w-full">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                  className="w-full"
                  disabled={isLoading || emailSent || socialLoading !== null}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="mt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || emailSent || socialLoading !== null}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : emailSent ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Email Sent
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="flex flex-row items-center gap-4 w-full">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-sm">Or</span>
              <Separator className="flex-1" />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => handleSocialSignIn("google")}
                disabled={isLoading || socialLoading !== null}
              >
                {socialLoading === "google" ? (
                  <CircularLoader size="sm" />
                ) : (
                  <>
                    <FcGoogle size={16} />
                    <span className="text-sm">Continue with Google</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialSignIn("github")}
                disabled={isLoading || socialLoading !== null}
              >
                {socialLoading === "github" ? (
                  <CircularLoader size="sm" />
                ) : (
                  <>
                    <Github size={16} />
                    <span className="text-sm">Continue with GitHub</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LoginPage;
