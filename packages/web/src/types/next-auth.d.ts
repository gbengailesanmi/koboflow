import 'express'

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string
      customerId: string
      email: string
      firstName?: string
      lastName?: string
    }
  }
}
