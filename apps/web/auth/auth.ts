import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { SignJWT, importPKCS8 } from "jose";
import { Resend } from "resend";
import { MemoryAdapter } from "./memory-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "fallback-secret-for-development",
  adapter: MemoryAdapter(),
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(process.env.RESEND_API_KEY && process.env.EMAIL_FROM
      ? [
          EmailProvider({
            server: {
              host: "smtp.resend.com",
              port: 465,
              auth: {
                user: "resend",
                pass: process.env.RESEND_API_KEY,
              },
            },
            from: process.env.EMAIL_FROM,
            sendVerificationRequest: async ({ identifier: email, url }) => {
              const { host } = new URL(url);
              const resend = new Resend(process.env.RESEND_API_KEY);

              try {
                await resend.emails.send({
                  from: process.env.EMAIL_FROM!,
                  to: email,
                  subject: `Sign in to ${host}`,
                  text: `Sign in to ${host}\n\n${url}`,
                  html: `
                    <body style="background: #f9f9f9;">
                      <table width="100%" border="0" cellspacing="20" cellpadding="0"
                        style="background: #f9f9f9; max-width: 600px; margin: auto; border-radius: 10px;">
                        <tr>
                          <td align="center"
                            style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: #333;">
                            Sign in to <strong>${host}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <table border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td align="center" style="border-radius: 5px;" bgcolor="#346df1">
                                  <a href="${url}"
                                    target="_blank"
                                    style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #fff; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid #346df1; display: inline-block; font-weight: bold;">
                                    Sign in
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td align="center"
                            style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: #333;">
                            If you did not request this email you can safely ignore it.
                          </td>
                        </tr>
                      </table>
                    </body>
                  `,
                  tags: [
                    {
                      name: "category",
                      value: "magic_link",
                    },
                  ],
                });
              } catch (error) {
                console.error("Failed to send magic link email:", error);
                throw new Error("Failed to send magic link email");
              }
            },
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            authorization: {
              params: {
                scope: "read:user user:email",
              },
            },
          }),
        ]
      : []),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
                scope:
                  "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
              },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async signIn() {
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      const userId =
        (token?.sub as string | undefined) ?? (session.user as any)?.id;
      (session.user as any).id = userId;
      (session as any).userId = userId;

      // Generate Convex token if we have the required configuration
      if (
        process.env.CONVEX_AUTH_PRIVATE_KEY &&
        process.env.NEXT_PUBLIC_CONVEX_URL
      ) {
        try {
          const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_URL.replace(
            /.cloud$/,
            ".site"
          );
          const privateKey = await importPKCS8(
            process.env.CONVEX_AUTH_PRIVATE_KEY,
            "RS256"
          );
          const convexToken = await new SignJWT({
            sub: userId,
            email: session.user?.email,
            name: session.user?.name,
            picture: session.user?.image,
          })
            .setProtectedHeader({ alg: "RS256" })
            .setIssuedAt()
            .setIssuer(CONVEX_SITE_URL)
            .setAudience("convex")
            .setExpirationTime("1h")
            .sign(privateKey);
          return { ...session, userId, convexToken };
        } catch (error) {
          console.warn("Failed to generate Convex token:", error);
          return { ...session, userId };
        }
      }
      return { ...session, userId };
    },
  },
});

declare module "next-auth" {
  interface Session {
    convexToken: string;
    userId: string;
  }
}
