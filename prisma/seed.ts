import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@ritssoftware.com";
  const password = "ChangeMe123!";

  const passwordHash = await bcrypt.hash(password, 10);

  // Delete existing admin first to force clean insert
  await prisma.user.deleteMany({ where: { email } });

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Admin",
    },
  });

  console.log(`✓ Admin created: ${admin.email}`);
  console.log(`✓ passwordHash: ${admin.passwordHash.slice(0, 20)}...`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });