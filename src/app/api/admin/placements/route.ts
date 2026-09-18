import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { isPlacementStatus } from "@/lib/types";

/** Admin placement queue — default REQUESTED; optional ?status= */
export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim() || "REQUESTED";

  if (status !== "ALL") {
    if (!isPlacementStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
  }

  const placements = await prisma.placementRequest.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "asc" },
    include: {
      advertiser: { select: { id: true, email: true, name: true } },
      screen: {
        include: {
          host: { select: { id: true, name: true, vertical: true, otherLabel: true } },
        },
      },
      creative: {
        select: {
          id: true,
          name: true,
          status: true,
          fileName: true,
          storedName: true,
          mimeType: true,
        },
      },
      reviewedBy: { select: { id: true, email: true, name: true } },
    },
  });

  return NextResponse.json({ placements });
}
