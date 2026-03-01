import { sql } from "./index";
import type { Tutor } from "@/types";

export async function getTutorByEmail(email: string): Promise<Tutor | null> {
  const rows = await sql`
    SELECT id, email, name, created_at
    FROM tutors
    WHERE email = ${email}
    LIMIT 1
  `;
  return (rows[0] as Tutor) ?? null;
}

export async function getTutorWithPasswordByEmail(
  email: string
): Promise<(Tutor & { password: string }) | null> {
  const rows = await sql`
    SELECT id, email, name, password, created_at
    FROM tutors
    WHERE email = ${email}
    LIMIT 1
  `;
  return (rows[0] as Tutor & { password: string }) ?? null;
}
