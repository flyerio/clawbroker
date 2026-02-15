import { auth, currentUser } from "@clerk/nextjs/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "isaac@cobroker.ai";

export async function verifyAdminAccess(): Promise<{
  authorized: boolean;
  email?: string;
}> {
  const { userId } = await auth();
  if (!userId) return { authorized: false };

  const user = await currentUser();
  if (!user) return { authorized: false };

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { authorized: false, email };
  }

  return { authorized: true, email };
}
