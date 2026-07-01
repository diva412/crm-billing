import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const TOKEN_COOKIE_NAME = "crm_token";
const TOKEN_EXPIRY = "7d";

if (!JWT_SECRET) {
  // Fail loudly at boot rather than silently signing tokens with "undefined"
  throw new Error("JWT_SECRET is not set in the environment");
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export { TOKEN_COOKIE_NAME };
