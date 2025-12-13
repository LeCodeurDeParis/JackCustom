import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/server/db"; // your drizzle instance
import { nextCookies } from "better-auth/next-js";
import * as schema from "@/server/db/schema/auth-schema";

export const auth = betterAuth({
  baseURL: "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
});
