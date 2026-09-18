import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_MIME,
  MAX_BYTES,
  ensureUploadDir,
  makeStoredName,
  absoluteUploadPath,
} from "@/lib/uploads";
import { writeFile } from "fs/promises";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "ADMIN") {
    const creatives = await prisma.creative.findMany({
      orderBy: { createdAt: "desc" },
      include: { advertiser: { select: { email: true, name: true } } },
    });
    return NextResponse.json({ creatives });
  }

  const creatives = await prisma.creative.findMany({
    where: { advertiserId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ creatives });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADVERTISER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const name = String(form.get("name") || "").trim();
    const notesRaw = form.get("notes");
    const notes = notesRaw ? String(notesRaw).trim() || null : null;
    const file = form.get("file");

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (!ALLOWED_MIME[file.type]) {
      return NextResponse.json(
        { error: "Only jpeg/png/webp images and mp4/webm videos are allowed" },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    await ensureUploadDir();
    const storedName = makeStoredName(file.type);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absoluteUploadPath(storedName), buffer);

    const creative = await prisma.creative.create({
      data: {
        name,
        notes,
        fileName: file.name,
        storedName,
        mimeType: file.type,
        fileSize: file.size,
        advertiserId: session.user.id,
      },
    });

    return NextResponse.json({ creative }, { status: 201 });
  } catch (e) {
    console.error("upload error", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
