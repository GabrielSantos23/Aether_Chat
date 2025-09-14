import type { Adapter } from "@auth/core/adapters";

// Simple in-memory adapter for NextAuth v5
// This is a minimal implementation for JWT strategy with email login
export function MemoryAdapter(): Adapter {
  const users: any[] = [];
  const accounts: any[] = [];
  const sessions: any[] = [];
  const verificationTokens: any[] = [];

  return {
    async createUser(user) {
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        ...user,
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
      };
      users.push(newUser);
      return newUser;
    },

    async getUser(id) {
      return users.find((user) => user.id === id) || null;
    },

    async getUserByEmail(email) {
      return users.find((user) => user.email === email) || null;
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const account = accounts.find(
        (account) =>
          account.provider === provider &&
          account.providerAccountId === providerAccountId
      );
      if (!account) return null;
      return users.find((user) => user.id === account.userId) || null;
    },

    async updateUser(user) {
      const index = users.findIndex((u) => u.id === user.id);
      if (index === -1) return user;
      users[index] = { ...users[index], ...user };
      return users[index];
    },

    async deleteUser(userId) {
      const index = users.findIndex((u) => u.id === userId);
      if (index === -1) return;
      users.splice(index, 1);
    },

    async linkAccount(account) {
      accounts.push(account);
      return account;
    },

    async unlinkAccount({ providerAccountId, provider }) {
      const index = accounts.findIndex(
        (account) =>
          account.provider === provider &&
          account.providerAccountId === providerAccountId
      );
      if (index === -1) return;
      accounts.splice(index, 1);
    },

    async createSession(session) {
      sessions.push(session);
      return session;
    },

    async getSessionAndUser(sessionToken) {
      const session = sessions.find((s) => s.sessionToken === sessionToken);
      if (!session) return null;
      const user = users.find((u) => u.id === session.userId);
      if (!user) return null;
      return { session, user };
    },

    async updateSession(session) {
      const index = sessions.findIndex(
        (s) => s.sessionToken === session.sessionToken
      );
      if (index === -1) return null;
      sessions[index] = { ...sessions[index], ...session };
      return sessions[index];
    },

    async deleteSession(sessionToken) {
      const index = sessions.findIndex((s) => s.sessionToken === sessionToken);
      if (index === -1) return;
      sessions.splice(index, 1);
    },

    async createVerificationToken(verificationToken) {
      verificationTokens.push(verificationToken);
      return verificationToken;
    },

    async useVerificationToken({ identifier, token }) {
      const index = verificationTokens.findIndex(
        (vt) => vt.identifier === identifier && vt.token === token
      );
      if (index === -1) return null;
      const verificationToken = verificationTokens[index];
      verificationTokens.splice(index, 1);
      return verificationToken;
    },
  };
}
