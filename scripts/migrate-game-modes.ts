/**
 * Adds game mode columns to game_sessions and game_players.
 * Usage: npx tsx scripts/migrate-game-modes.ts
 */

import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const sql = neon(process.env.DATABASE_URL);

  await sql`
    ALTER TABLE game_sessions
      ADD COLUMN IF NOT EXISTS mode        TEXT  NOT NULL DEFAULT 'classic',
      ADD COLUMN IF NOT EXISTS mode_state  JSONB,
      ADD COLUMN IF NOT EXISTS team_a_name TEXT  NOT NULL DEFAULT 'Blue Team',
      ADD COLUMN IF NOT EXISTS team_b_name TEXT  NOT NULL DEFAULT 'Red Team'
  `;

  await sql`
    ALTER TABLE game_players
      ADD COLUMN IF NOT EXISTS team         TEXT,
      ADD COLUMN IF NOT EXISTS robot_number INTEGER
  `;

  console.log("Migration complete.");
}

main().catch(console.error);
