import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      workspaces: Array<{
        id: string
        name: string
        slug: string
        role: Role
      }>
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user ID to session
      session.user.id = user.id

      // Load user's workspaces with roles
      const memberships = await prisma.workspaceMember.findMany({
        where: { userId: user.id },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })

      session.user.workspaces = memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
      }))

      return session
    },
    async signIn({ user, account }) {
      // On first sign in, create a default workspace for the user
      if (account?.provider === 'google') {
        const existingWorkspace = await prisma.workspaceMember.findFirst({
          where: { userId: user.id! },
        })

        if (!existingWorkspace) {
          // Create default workspace
          const slug = generateSlug(user.name || user.email || 'workspace')

          await prisma.workspace.create({
            data: {
              name: `${user.name || 'Meu'} Workspace`,
              slug,
              members: {
                create: {
                  userId: user.id!,
                  role: 'OWNER',
                },
              },
            },
          })
        }
      }

      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
  },
})

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)

  const random = Math.random().toString(36).slice(2, 8)
  return `${base}-${random}`
}
