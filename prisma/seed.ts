import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@adnabbit.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "admin123!";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      name: "AdNabbit Admin",
    },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      name: "AdNabbit Admin",
    },
  });

  console.log(`Seeded ADMIN user: ${admin.email} (id=${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
