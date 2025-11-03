import { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      customerId?: string
    } & DefaultSession["user"]
  }

  interface User {
    customerId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    customerId?: string
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    customerId?: string
  }
}
