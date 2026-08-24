import { z } from "zod";

const PLACEHOLDER_AUTH_SECRET = "change-me";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").url("DATABASE_URL must be a valid connection URL"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  UPLOADS_DIR: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters").optional(),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration — ${details}`);
  }

  if (
    process.env.NODE_ENV === "production" &&
    parsed.data.AUTH_SECRET === PLACEHOLDER_AUTH_SECRET
  ) {
    throw new Error(
      `AUTH_SECRET is still the placeholder value "${PLACEHOLDER_AUTH_SECRET}" from .env.example. Generate a real one with \`npx auth secret\` before starting in production.`
    );
  }

  return parsed.data;
}
