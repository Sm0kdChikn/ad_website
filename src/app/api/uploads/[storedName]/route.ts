import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { absoluteUploadPath } from "@/lib/uploads";
import { readFile } from "fs/promises";

export async function GET(
  _req: Request,
  { params }: { params: { storedName: string } }
) {
  const storedName = params.storedName;
  if (!storedName || storedName.includes("..") || storedName.includes("/")) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  // Creative file (authenticated owner/admin)
  const creative = await prisma.creative.findFirst({
    where: { storedName },
  });
  if (creative) {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isOwner = creative.advertiserId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
      const data = await readFile(absoluteUploadPath(creative.storedName));
      return new NextResponse(data, {
        headers: {
          "Content-Type": creative.mimeType,
          "Content-Disposition": `inline; filename="${creative.fileName}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
    }
  }

  // Profile logo — public if published; else owner/admin only
  const profile = await prisma.advertiserProfile.findFirst({
    where: { logoStoredName: storedName },
  });
  if (profile) {
    const isOwner = session?.user?.id === profile.userId;
    const isAdmin = session?.user?.role === "ADMIN";
    if (!profile.published && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    try {
      const data = await readFile(absoluteUploadPath(storedName));
      const ext = storedName.split(".").pop()?.toLowerCase();
      const mime =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : ext === "jpg" || ext === "jpeg"
              ? "image/jpeg"
              : "application/octet-stream";
      return new NextResponse(data, {
        headers: {
          "Content-Type": mime,
          "Content-Disposition": `inline; filename="${storedName}"`,
          "Cache-Control": profile.published
            ? "public, max-age=3600"
            : "private, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
