import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

// Single-instance private deployment: an in-process Map is enough, no Redis.
const failedAttempts = new Map<string, { count: number; firstAttemptAt: number }>();

class TooManyAttemptsError extends CredentialsSignin {
  code = "Too many attempts, try again later";
}

function isLockedOut(email: string) {
  const entry = failedAttempts.get(email);
  if (!entry) return false;
  if (Date.now() - entry.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    failedAttempts.delete(email);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailure(email: string) {
  const entry = failedAttempts.get(email);
  if (!entry || Date.now() - entry.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    failedAttempts.set(email, { count: 1, firstAttemptAt: Date.now() });
    return;
  }
  entry.count += 1;
}

async function logLoginAttempt(
  action: "LOGIN_SUCCESS" | "LOGIN_FAILURE",
  email: string,
  userId?: string,
  reason?: string
) {
  await prisma.auditLog
    .create({
      data: {
        userId,
        action,
        entityType: "User",
        entityId: userId ?? email,
        after: reason ? { email, reason } : { email },
      },
    })
    .catch(() => {});
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const { password } = parsed.data;

        if (isLockedOut(email)) {
          await logLoginAttempt("LOGIN_FAILURE", email, undefined, "RATE_LIMITED");
          throw new TooManyAttemptsError();
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.isActive) {
          recordFailure(email);
          await logLoginAttempt(
            "LOGIN_FAILURE",
            email,
            user?.id,
            user ? "INACTIVE" : "UNKNOWN_EMAIL"
          );
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordsMatch) {
          recordFailure(email);
          await logLoginAttempt("LOGIN_FAILURE", email, user.id, "BAD_PASSWORD");
          return null;
        }

        failedAttempts.delete(email);
        await logLoginAttempt("LOGIN_SUCCESS", email, user.id);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
});
