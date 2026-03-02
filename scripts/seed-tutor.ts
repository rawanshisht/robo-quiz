/**
 * Creates an initial tutor account.
 * Usage: npx tsx scripts/seed-tutor.ts
 *
 * Set these env vars first (or add them to .env.local):
 *   DATABASE_URL=...
 */

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const email = "admin@robocode.uk";
const name = "Admin";
const password = "adminpassword";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  const hash = await bcrypt.hash(password, 12);

  await sql`
    INSERT INTO tutors (email, name, password)
    VALUES (${email}, ${name}, ${hash})
    ON CONFLICT (email) DO NOTHING
  `;

  console.log(`Tutor created: ${email} / ${password}`);
}

main().catch(console.error);
