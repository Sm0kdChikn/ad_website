import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";

const schema = z.object({
  reason: z.string().min(1, "Rejection reason is required").max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const placement = await prisma.placementRequest.findUnique({ where: { id: params.id } });
  if (!placement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (placement.status !== "REQUESTED") {
    return NextResponse.json(
      { error: "Only REQUESTED placements can be rejected" },
      { status: 400 }
    );
  }

  const updated = await prisma.placementRequest.update({
    where: { id: params.id },
    data: {
      status: "REJECTED",
      rejectReason: parsed.data.reason,
      reviewedAt: new Date(),
      reviewedById: auth.user!.id,
    },
    include: {
      advertiser: { select: { id: true, email: true, name: true } },
      screen: {
        include: {
          host: { select: { id: true, name: true, vertical: true, otherLabel: true } },
        },
      },
      creative: {
        select: { id: true, name: true, status: true, fileName: true, storedName: true },
      },
    },
  });

  return NextResponse.json({ placement: updated });
}
