import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      id: "firebase",
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null
        
        try {
          // Verify Firebase ID token securely using Firebase Identity Toolkit REST API
          const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
          const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: credentials.idToken })
          })
          
          if (!verifyRes.ok) return null
          
          const data = await verifyRes.json()
          const firebaseUser = data.users?.[0]
          
          if (!firebaseUser || !firebaseUser.email) return null
          
          let user = await prisma.user.findUnique({
            where: { email: firebaseUser.email }
          })
          
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: firebaseUser.email,
                name: firebaseUser.displayName || "Pirate",
                image: firebaseUser.photoUrl || null,
                emailVerified: firebaseUser.emailVerified ? new Date() : null,
                role: "USER"
              }
            })
          }
          
          return user
        } catch (error) {
          console.error("Firebase token verification failed:", error)
          return null
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })
        
        if (!user || !user.password) return null

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (passwordsMatch) {
          // Return user object including role and mobile
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            mobile: user.mobile,
            role: user.role
          } as any
        }
        return null
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { // User is available during sign-in
        token.id = user.id
        token.role = (user as any).role
        token.mobile = (user as any).mobile
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as "ADMIN" | "USER"
        ;(session.user as any).mobile = token.mobile as string | null
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
})
