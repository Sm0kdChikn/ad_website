import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isHostVertical, isInventoryStatus } from "@/lib/types";
import type { Prisma } from "@prisma/client";

/** Advertiser browse: OPEN/LIMITED by default; FULL only when explicitly requested (unavailable). */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADVERTISER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim() || "";
  const zip = searchParams.get("zip")?.trim() || "";
  const vertical = searchParams.get("vertical")?.trim() || "";
  const q = searchParams.get("q")?.trim() || "";
  const inventoryStatus = searchParams.get("inventoryStatus")?.trim() || "";
  const includeFull = searchParams.get("includeFull") === "1" || searchParams.get("includeFull") === "true";

  const where: Prisma.ScreenWhereInput = {};

  if (inventoryStatus) {
    if (!isInventoryStatus(inventoryStatus)) {
      return NextResponse.json({ error: "Invalid inventoryStatus" }, { status: 400 });
    }
    where.inventoryStatus = inventoryStatus;
  } else if (includeFull) {
    // all statuses
  } else {
    where.inventoryStatus = { in: ["OPEN", "LIMITED"] };
  }

  if (city) where.city = { contains: city };
  if (zip) where.zip = { contains: zip };
  if (vertical) {
    if (!isHostVertical(vertical)) {
      return NextResponse.json({ error: "Invalid vertical" }, { status: 400 });
    }
    where.host = { vertical };
  }
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { notes: { contains: q } },
      { host: { name: { contains: q } } },
    ];
  }

  const screens = await prisma.screen.findMany({
    where,
    orderBy: [{ city: "asc" }, { name: "asc" }],
    include: {
      host: {
        select: { id: true, name: true, vertical: true, otherLabel: true },
      },
    },
  });

  return NextResponse.json({ screens });
}
