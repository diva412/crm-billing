import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const body = await req.json();

  console.log("=== LOGIN ATTEMPT ===");
  console.log("Body received:", body);

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    console.log("Validation failed:", parsed.error.issues);
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  console.log("Email:", email);
  console.log("Password length:", password.length);

  const user = await prisma.user.findUnique({ where: { email } });

  console.log("User found:", !!user);
  console.log("User email:", user?.email);
  console.log("passwordHash exists:", !!user?.passwordHash);
  console.log("passwordHash value:", user?.passwordHash ?? "NULL/UNDEFINED");

  if (!user) {
    console.log("FAIL: user not found");
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (!user.passwordHash) {
    console.log("FAIL: passwordHash is empty");
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const passwordMatch = await verifyPassword(password, user.passwordHash);
  console.log("Password match:", passwordMatch);

  if (!passwordMatch) {
    console.log("FAIL: password did not match");
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = signToken({ userId: user.id, email: user.email });

  const response = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });

  response.cookies.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  console.log("=== LOGIN SUCCESS ===");
  return response;
}