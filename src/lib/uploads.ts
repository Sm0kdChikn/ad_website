import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

export const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export function extensionForMime(mime: string): string | null {
  return ALLOWED_MIME[mime] ?? null;
}

export function makeStoredName(mime: string): string {
  const ext = extensionForMime(mime) || ".bin";
  return `${randomUUID()}${ext}`;
}

export function absoluteUploadPath(storedName: string): string {
  return path.join(UPLOAD_DIR, storedName);
}
