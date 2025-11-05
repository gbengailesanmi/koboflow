import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname
      
      // Public routes that anyone can access
      const publicRoutes = ['/', '/verify-email', '/auth-redirect']
      const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
      
      // Always allow API routes
      if (pathname.startsWith('/api')) {
        return true
      }
      
      // Always allow auth-redirect route (needed for post-login flow)
      if (pathname === '/auth-redirect') {
        return true
      }
      
      // If logged in and trying to access login/signup, redirect to auth-redirect
      // which will then send them to dashboard
      if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
        return Response.redirect(new URL('/auth-redirect', nextUrl))
      }
      
      // Allow login/signup pages for non-logged-in users
      if (!isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
        return true
      }
      
      // If not logged in and accessing public route, allow
      if (!isLoggedIn && isPublicRoute) {
        return true
      }
      
      // If not logged in and accessing protected route, redirect to login
      if (!isLoggedIn) {
        return false // NextAuth will redirect to signIn page
      }
      
      // Logged in users can access everything else
      return true
    },
  },
  providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig
