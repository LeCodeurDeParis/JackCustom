import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { router } from "@/server/router";

const getApiUrl = () => {
  if (typeof window !== "undefined") {
    // Côté client : utiliser l'origine actuelle
    return `${window.location.origin}/api/orpc`;
  }
  // Côté serveur (SSR) : utiliser localhost par défaut
  return "http://localhost:3000/api/orpc";
};
const link = new RPCLink({
  url: getApiUrl(),
  fetch: (url, options) => {
    return fetch(url, {
      ...options,
      credentials: "include",
    });
  },
});

export const orpc: RouterClient<typeof router> = createORPCClient(link);
