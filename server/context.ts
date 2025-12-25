import { os } from "@orpc/server";
import type { IncomingHttpHeaders } from "node:http";

export const base = os.$context<{ headers: IncomingHttpHeaders }>();

export const authenticatedBase = os.$context<{
  headers: IncomingHttpHeaders;
}>();
