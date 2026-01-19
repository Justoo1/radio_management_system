/**
 * NextAuth.js v5 Configuration
 * Handles authentication for the application
 */

import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name?: string
    organizationId: string
    organizationSlug: string
    role: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string
      organizationId: string
      organizationSlug: string
      role: string
    }
  }
}


export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              organization: true,
              role: true,
            },
          })

          if (!user) {
            return null
          }

          // Use bcryptjs to securely compare passwords
          const isPasswordValid = await compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          // Check if organization is suspended, cancelled, or expired (after password verification)
          if (user.organization) {
            const organizationStatus = user.organization.status
            if (organizationStatus === 'SUSPENDED' || organizationStatus === 'CANCELLED') {
              // Return null to fail authentication, error will be handled in signIn callback
              throw new Error('ORGANIZATION_SUSPENDED')
            }
            if (organizationStatus === 'EXPIRED') {
              throw new Error('ORGANIZATION_EXPIRED')
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            organizationId: user.organizationId,
            organizationSlug: user.organization?.slug || '',
            role: user.role?.name || 'USER',
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn() {
      // This callback runs after authorize
      // Organization status is already verified in authorize()
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.organizationId = user.organizationId
        token.organizationSlug = user.organizationSlug
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.organizationId = token.organizationId as string
        session.user.organizationSlug = token.organizationSlug as string
        session.user.role = token.role as string

        // OPTIMIZED: Removed per-request organization status check
        // Organization status is verified at login time in authorize()
        // For suspended/expired orgs, use the /api/auth/check-org-status endpoint
        // or middleware check when critical operations are performed
        // This eliminates 1 database query per authenticated request
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
})
