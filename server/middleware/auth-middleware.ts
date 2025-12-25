import { auth } from "@/utils/auth";
import { base } from "../context";
import { ORPCError } from "@orpc/server";

export const authMiddleware = base.middleware(async ({ context, next }) => {
  // Convertir les headers Node.js en format compatible avec better-auth
  const headers = new Headers();

  Object.entries(context.headers).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key.toLowerCase(), v));
      } else {
        headers.set(key.toLowerCase(), String(value));
      }
    }
  });

  try {
    const sessionData = await auth.api.getSession({
      headers: headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      throw new ORPCError("UNAUTHORIZED");
    }

    return next({
      context: {
        session: sessionData.session,
        user: sessionData.user,
      },
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    throw new ORPCError("UNAUTHORIZED");
  }
});
