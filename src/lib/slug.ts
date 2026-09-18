import { prisma } from "./prisma";

/** Derive a URL-safe slug from a business / display name. */
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "advertiser";
}

/**
 * Return a unique slug derived from `name`.
 * If `excludeUserId` owns an existing row with the same slug, that is allowed (idempotent update).
 */
export async function uniqueSlugFromName(
  name: string,
  excludeUserId?: string
): Promise<string> {
  const base = slugify(name);
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? base : `${base}-${n}`;
    const existing = await prisma.advertiserProfile.findUnique({
      where: { slug: candidate },
      select: { userId: true },
    });
    if (!existing || (excludeUserId && existing.userId === excludeUserId)) {
      return candidate;
    }
    n += 1;
    if (n > 1000) throw new Error("Could not allocate unique slug");
  }
}
