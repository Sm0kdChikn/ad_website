import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const profiles = await prisma.advertiserProfile.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });
  return NextResponse.json({ profiles });
}
