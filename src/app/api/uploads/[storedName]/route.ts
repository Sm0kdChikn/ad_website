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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creative = await prisma.creative.findFirst({
    where: { storedName: params.storedName },
  });
  if (!creative) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
