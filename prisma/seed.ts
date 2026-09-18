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

  // Ticket A — sample hosts + screens (idempotent by name)
  const samples: Array<{
    name: string;
    vertical: string;
    otherLabel?: string;
    notes?: string;
    screens: Array<{
      name: string;
      city: string;
      zip: string;
      inventoryStatus: string;
      notes?: string;
    }>;
  }> = [
    {
      name: "Denver Peak Fitness",
      vertical: "GYM",
      notes: "Downtown flagship gym",
      screens: [
        { name: "Lobby TV", city: "Denver", zip: "80202", inventoryStatus: "OPEN" },
        {
          name: "Cardio wall",
          city: "Denver",
          zip: "80202",
          inventoryStatus: "LIMITED",
          notes: "2 of 4 slots open",
        },
      ],
    },
    {
      name: "Mile High Sports Bar",
      vertical: "SPORTS_BAR",
      screens: [
        {
          name: "Bar main screen",
          city: "Denver",
          zip: "80205",
          inventoryStatus: "FULL",
        },
        {
          name: "Patio screen",
          city: "Denver",
          zip: "80205",
          inventoryStatus: "OPEN",
        },
      ],
    },
    {
      name: "Cherry Creek Dental",
      vertical: "MEDICAL_DENTAL",
      screens: [
        {
          name: "Waiting room A",
          city: "Denver",
          zip: "80206",
          inventoryStatus: "OPEN",
        },
      ],
    },
    {
      name: "Front Range Co-Working",
      vertical: "OTHER",
      otherLabel: "Coworking",
      notes: "Demo OTHER vertical",
      screens: [
        {
          name: "Reception display",
          city: "Boulder",
          zip: "80301",
          inventoryStatus: "LIMITED",
        },
      ],
    },
  ];

  for (const s of samples) {
    let host = await prisma.host.findFirst({ where: { name: s.name } });
    if (!host) {
      host = await prisma.host.create({
        data: {
          name: s.name,
          vertical: s.vertical,
          otherLabel: s.otherLabel ?? null,
          notes: s.notes ?? null,
        },
      });
      console.log(`Seeded host: ${host.name} (${host.vertical})`);
    } else {
      host = await prisma.host.update({
        where: { id: host.id },
        data: {
          vertical: s.vertical,
          otherLabel: s.otherLabel ?? null,
          notes: s.notes ?? null,
        },
      });
      console.log(`Updated host: ${host.name}`);
    }

    for (const sc of s.screens) {
      const existing = await prisma.screen.findFirst({
        where: { hostId: host.id, name: sc.name },
      });
      if (!existing) {
        const screen = await prisma.screen.create({
          data: {
            name: sc.name,
            city: sc.city,
            zip: sc.zip,
            inventoryStatus: sc.inventoryStatus,
            notes: sc.notes ?? null,
            hostId: host.id,
          },
        });
        console.log(`  + screen: ${screen.name} (${screen.city} ${screen.zip})`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
