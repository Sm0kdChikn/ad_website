import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { isHostVertical, isInventoryStatus } from "@/lib/types";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim() || "";
  const zip = searchParams.get("zip")?.trim() || "";
  const inventoryStatus = searchParams.get("inventoryStatus")?.trim() || "";
  const vertical = searchParams.get("vertical")?.trim() || "";

  const where: Prisma.ScreenWhereInput = {};
  if (city) where.city = { contains: city };
  if (zip) where.zip = { contains: zip };
  if (inventoryStatus) {
    if (!isInventoryStatus(inventoryStatus)) {
      return NextResponse.json({ error: "Invalid inventoryStatus" }, { status: 400 });
    }
    where.inventoryStatus = inventoryStatus;
  }
  if (vertical) {
    if (!isHostVertical(vertical)) {
      return NextResponse.json({ error: "Invalid vertical" }, { status: 400 });
    }
    where.host = { vertical };
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

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let body: {
    name?: string;
    city?: string;
    zip?: string;
    inventoryStatus?: string;
    notes?: string | null;
    hostId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const city = (body.city || "").trim();
  const zip = (body.zip || "").trim();
  const inventoryStatus = (body.inventoryStatus || "OPEN").trim();
  const notes = body.notes?.trim() || null;
  const hostId = (body.hostId || "").trim();

  if (!name || !city || !zip || !hostId) {
    return NextResponse.json(
      { error: "name, city, zip, and hostId are required" },
      { status: 400 }
    );
  }
  if (!isInventoryStatus(inventoryStatus)) {
    return NextResponse.json({ error: "Invalid inventoryStatus" }, { status: 400 });
  }

  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host) {
    return NextResponse.json({ error: "Host not found" }, { status: 404 });
  }

  const screen = await prisma.screen.create({
    data: { name, city, zip, inventoryStatus, notes, hostId },
    include: {
      host: {
        select: { id: true, name: true, vertical: true, otherLabel: true },
      },
    },
  });

  return NextResponse.json({ screen }, { status: 201 });
}
