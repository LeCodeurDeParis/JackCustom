import { toNodeHandler } from "better-auth/node";
import { auth } from "@/utils/auth";

export const config = { api: { bodyParser: false } };

export default toNodeHandler(auth.handler);
