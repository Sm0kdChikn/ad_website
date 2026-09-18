import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  screenId: z.string().min(1),
  creativeId: z.string().min(1),
  note: z.string().max(2000).optional().nullable(),
});

/** List own placement requests (advertiser). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADVERTISER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const placements = await prisma.placementRequest.findMany({
    where: { advertiserId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
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
    },
  });

  return NextResponse.json({ placements });
}

/** Create placement request — creative must be owned + APPROVED; screen OPEN|LIMITED. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADVERTISER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { screenId, creativeId, note } = parsed.data;
  const advertiserId = session.user.id;

  const creative = await prisma.creative.findUnique({ where: { id: creativeId } });
  if (!creative || creative.advertiserId !== advertiserId) {
    return NextResponse.json({ error: "Creative not found" }, { status: 404 });
  }
  if (creative.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Only APPROVED creatives can be attached to a placement request" },
      { status: 400 }
    );
  }

  const screen = await prisma.screen.findUnique({
    where: { id: screenId },
    include: { host: { select: { id: true, name: true, vertical: true, otherLabel: true } } },
  });
  if (!screen) {
    return NextResponse.json({ error: "Screen not found" }, { status: 404 });
  }
  if (screen.inventoryStatus === "FULL") {
    return NextResponse.json(
      { error: "Screen inventory is FULL — not requestable" },
      { status: 400 }
    );
  }
  if (screen.inventoryStatus !== "OPEN" && screen.inventoryStatus !== "LIMITED") {
    return NextResponse.json({ error: "Screen is not available for placement" }, { status: 400 });
  }

  // Optional: block duplicate pending same creative+screen
  const existing = await prisma.placementRequest.findFirst({
    where: {
      advertiserId,
      screenId,
      creativeId,
      status: "REQUESTED",
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A pending request for this creative on this screen already exists", placement: existing },
      { status: 409 }
    );
  }

  const placement = await prisma.placementRequest.create({
    data: {
      advertiserId,
      screenId,
      creativeId,
      status: "REQUESTED",
      note: note?.trim() || null,
    },
    include: {
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
    },
  });

  return NextResponse.json({ placement }, { status: 201 });
}
