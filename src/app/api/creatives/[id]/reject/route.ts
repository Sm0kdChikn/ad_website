import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  reason: z.string().min(1, "Rejection reason is required").max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const creative = await prisma.creative.findUnique({ where: { id: params.id } });
  if (!creative) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (creative.status !== "PENDING") {
    return NextResponse.json({ error: "Only PENDING creatives can be rejected" }, { status: 400 });
  }

  const updated = await prisma.creative.update({
    where: { id: params.id },
    data: {
      status: "REJECTED",
      rejectReason: parsed.data.reason,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ creative: updated });
}
