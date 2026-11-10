export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

// Called from the login screen so the function and a sleeping Neon database wake up while the user types.
export async function GET() {
  await prisma.$queryRaw`SELECT 1`.catch(() => {});
  return new Response(null, { status: 204 });
}
