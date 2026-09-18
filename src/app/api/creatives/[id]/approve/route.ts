import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const creative = await prisma.creative.findUnique({ where: { id: params.id } });
  if (!creative) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (creative.status !== "PENDING") {
    return NextResponse.json({ error: "Only PENDING creatives can be approved" }, { status: 400 });
  }

  const updated = await prisma.creative.update({
    where: { id: params.id },
    data: {
      status: "APPROVED",
      rejectReason: null,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ creative: updated });
}
