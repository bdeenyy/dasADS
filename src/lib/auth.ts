import NextAuth, { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export const authOptions: NextAuthConfig = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                    include: { organization: true }
                })

                if (!user || !user.hashedPassword) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.hashedPassword
                )

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    organizationId: user.organizationId,
                    organizationName: user.organization.name
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.organizationId = user.organizationId
                token.organizationName = user.organizationName
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.sub as string
                session.user.role = token.role as string
                session.user.organizationId = token.organizationId as string
                session.user.organizationName = token.organizationName as string
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
