import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { isInventoryStatus } from "@/lib/types";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const screen = await prisma.screen.findUnique({
    where: { id: params.id },
    include: {
      host: {
        select: { id: true, name: true, vertical: true, otherLabel: true },
      },
    },
  });
  if (!screen) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ screen });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const existing = await prisma.screen.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  const name = body.name !== undefined ? body.name.trim() : existing.name;
  const city = body.city !== undefined ? body.city.trim() : existing.city;
  const zip = body.zip !== undefined ? body.zip.trim() : existing.zip;
  const inventoryStatus =
    body.inventoryStatus !== undefined
      ? body.inventoryStatus.trim()
      : existing.inventoryStatus;
  const notes =
    body.notes !== undefined ? body.notes?.trim() || null : existing.notes;
  const hostId =
    body.hostId !== undefined ? body.hostId.trim() : existing.hostId;

  if (!name || !city || !zip || !hostId) {
    return NextResponse.json(
      { error: "name, city, zip, and hostId are required" },
      { status: 400 }
    );
  }
  if (!isInventoryStatus(inventoryStatus)) {
    return NextResponse.json({ error: "Invalid inventoryStatus" }, { status: 400 });
  }

  if (hostId !== existing.hostId) {
    const host = await prisma.host.findUnique({ where: { id: hostId } });
    if (!host) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 });
    }
  }

  const screen = await prisma.screen.update({
    where: { id: params.id },
    data: { name, city, zip, inventoryStatus, notes, hostId },
    include: {
      host: {
        select: { id: true, name: true, vertical: true, otherLabel: true },
      },
    },
  });

  return NextResponse.json({ screen });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const existing = await prisma.screen.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.screen.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
