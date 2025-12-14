import { auth } from "@/utils/auth";

export const verifyToken = async (token: string) => {
  const session = await auth.api.getSession({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return session;
};
