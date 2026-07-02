// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEFAULT_ADMIN_EMAIL ?? "admin@crmbilling.com";
  const password = process.env.DEFAULT_ADMIN_PASSWORD ?? "ChangeMe123!";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.deleteMany({ where: { email } });

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Admin",
    },
  });

  console.log(`✓ Admin created: ${admin.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());