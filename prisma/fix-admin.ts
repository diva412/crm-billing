import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear any broken user records
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  const user = await prisma.user.create({
    data: {
      email: "admin@ritssoftware.com",
      name: "Admin",
      passwordHash,
    },
  });

  console.log("✓ Created:", user.email);
  console.log("✓ Hash starts with:", user.passwordHash.slice(0, 15));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());