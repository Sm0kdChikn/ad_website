import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const placement = await prisma.placementRequest.findUnique({ where: { id: params.id } });
  if (!placement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (placement.status !== "REQUESTED") {
    return NextResponse.json(
      { error: "Only REQUESTED placements can be approved" },
      { status: 400 }
    );
  }

  const updated = await prisma.placementRequest.update({
    where: { id: params.id },
    data: {
      status: "APPROVED",
      rejectReason: null,
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
