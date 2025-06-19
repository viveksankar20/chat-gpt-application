import type { Mongoose } from "mongoose"

declare global {
  var mongoose:
    | {
        conn: Mongoose | null
        promise: Promise<Mongoose> | null
      }
    | undefined

  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string
      OPENAI_API_KEY: string
      NODE_ENV: "development" | "production" | "test"
    }
  }
}
