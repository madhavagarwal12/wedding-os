import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@weddingops.local";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe123!";

  const organization = await prisma.organization.upsert({
    where: { id: "default-org" },
    update: {},
    create: {
      id: "default-org",
      name: "Your Wedding Company",
      currency: "INR",
    },
  });

  const existing = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    await prisma.user.create({
      data: {
        name: "Owner",
        email: ownerEmail,
        passwordHash,
        role: "OWNER",
        organizationId: organization.id,
      },
    });
    console.log(`Created owner account: ${ownerEmail} / ${ownerPassword}`);
  } else {
    console.log(`Owner account already exists: ${ownerEmail}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
