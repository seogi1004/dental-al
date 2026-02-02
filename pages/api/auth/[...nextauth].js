import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // ★ 필수: 구글 시트 권한, 오프라인 액세스(토큰 갱신), 로그인 강제 확인
          // drive.metadata.readonly: 시트 편집 권한 확인용
          scope: "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET, // ★ 필수
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        
        // 구글 Drive API로 편집 권한(canEdit) 확인
        try {
            const sheetId = process.env.GOOGLE_SHEET_ID;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${sheetId}?fields=capabilities(canEdit)`, {
                headers: { Authorization: `Bearer ${account.access_token}` }
            });
            const data = await res.json();
            // canEdit가 true이면 관리자(Admin)로 간주
            token.isAdmin = data?.capabilities?.canEdit || false;
        } catch (e) {
            console.error("Permission Check Error:", e);
            token.isAdmin = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.isAdmin = token.isAdmin; // 세션에 권한 정보 전달
      return session;
    },
  },
};

export default NextAuth(authOptions);
