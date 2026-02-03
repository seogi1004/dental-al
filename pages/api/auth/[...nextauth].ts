import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }: any) {
      if (account) {
        token.accessToken = account.access_token;
        
        try {
            const sheetId = process.env.GOOGLE_SHEET_ID;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${sheetId}?fields=capabilities(canEdit)`, {
                headers: { Authorization: `Bearer ${account.access_token}` }
            });
            const data = await res.json();
            token.isAdmin = data?.capabilities?.canEdit || false;
        } catch (e) {
            console.error("Permission Check Error:", e);
            token.isAdmin = false;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.isAdmin = token.isAdmin;
      return session;
    },
  },
};

export default NextAuth(authOptions);
