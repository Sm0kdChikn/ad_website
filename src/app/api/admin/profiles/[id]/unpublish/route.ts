import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const existing = await prisma.advertiserProfile.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profile = await prisma.advertiserProfile.update({
    where: { id: params.id },
    data: { published: false },
  });

  return NextResponse.json({ profile });
}
