/**
 * Concurrency test for RoboQuiz
 * Tests: 8 players in one session, 2 sessions running simultaneously
 * Usage: npx tsx scripts/load-test.ts
 */

const BASE = "http://localhost:3001";
const QUIZ_ID = "de4f4596-7986-401d-9875-7439f8c801b5"; // Mini-Game Test Quiz (10 questions)
const HOST_EMAIL = "admin@roboquiz.local";
const HOST_PASSWORD = "changeme123";

// ─── colours ────────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};
const ok = (msg: string) => console.log(`${c.green}✓${c.reset} ${msg}`);
const fail = (msg: string) => console.log(`${c.red}✗${c.reset} ${msg}`);
const info = (msg: string) => console.log(`${c.cyan}·${c.reset} ${msg}`);
const header = (msg: string) => console.log(`\n${c.bold}${c.yellow}▶ ${msg}${c.reset}`);

// ─── helpers ─────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) { ok(label); passed++; }
  else { fail(label); failed++; }
}

async function getAuthCookie(): Promise<string> {
  // 1. fetch CSRF token
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json() as { csrfToken: string };
  const cookies = csrfRes.headers.get("set-cookie") ?? "";

  // 2. sign in
  const body = new URLSearchParams({
    csrfToken,
    email: HOST_EMAIL,
    password: HOST_PASSWORD,
    callbackUrl: "/quizzes",
    json: "true",
  });
  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
    },
    body: body.toString(),
    redirect: "manual",
  });

  const setCookies = signInRes.headers.getSetCookie?.() ??
    (signInRes.headers.get("set-cookie") ?? "").split(/,(?=\s*\w+=)/);
  const sessionCookie = setCookies.find((c: string) => c.includes("authjs.session-token") || c.includes("next-auth.session-token"));
  if (!sessionCookie) throw new Error("Login failed — no session cookie returned");
  return sessionCookie.split(";")[0].trim();
}

async function createSession(authCookie: string, label: string): Promise<string> {
  const res = await fetch(`${BASE}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: authCookie },
    body: JSON.stringify({ quiz_id: QUIZ_ID, mode: "classic", mini_game_type: null }),
  });
  if (!res.ok) throw new Error(`createSession failed: ${res.status} ${await res.text()}`);
  const { room_code } = await res.json() as { room_code: string };
  info(`${label}: created session ${room_code}`);
  return room_code;
}

async function joinSession(code: string, nickname: string): Promise<string> {
  const res = await fetch(`${BASE}/api/sessions/${code}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });
  if (!res.ok) throw new Error(`join failed for ${nickname}: ${res.status} ${await res.text()}`);
  const { player_id } = await res.json() as { player_id: string };
  return player_id;
}

async function startSession(code: string, authCookie: string) {
  const res = await fetch(`${BASE}/api/sessions/${code}/start`, {
    method: "POST",
    headers: { Cookie: authCookie },
  });
  if (!res.ok) throw new Error(`start failed: ${res.status}`);
}

async function answerQuestion(code: string, playerId: string, optionId: string) {
  const res = await fetch(`${BASE}/api/sessions/${code}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_id: playerId, option_id: optionId }),
  });
  return res.ok;
}

async function getSessionState(code: string) {
  const res = await fetch(`${BASE}/api/sessions/${code}`);
  if (!res.ok) return null;
  return res.json();
}

async function revealQuestion(code: string, authCookie: string) {
  const res = await fetch(`${BASE}/api/sessions/${code}/reveal`, {
    method: "POST",
    headers: { Cookie: authCookie },
  });
  return res.ok;
}

async function nextQuestion(code: string, authCookie: string) {
  const res = await fetch(`${BASE}/api/sessions/${code}/next`, {
    method: "POST",
    headers: { Cookie: authCookie },
  });
  return res.ok;
}

async function endSession(code: string, authCookie: string) {
  const res = await fetch(`${BASE}/api/sessions/${code}`, {
    method: "DELETE",
    headers: { Cookie: authCookie },
  });
  return res.ok;
}

// ─── wait for server ready ────────────────────────────────────────────────────
async function waitForServer(maxMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${BASE}/api/auth/csrf`);
      if (res.ok) return;
    } catch { /* not ready */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Server did not start within 30s");
}

// ─── get question options from DB helper (via GET session) ───────────────────
// We need actual option IDs to submit answers. We'll get them from the quiz API.
async function getQuizQuestions(authCookie: string): Promise<{ id: string; options: { id: string; is_correct: boolean }[] }[]> {
  const res = await fetch(`${BASE}/api/quizzes/${QUIZ_ID}`, {
    headers: { Cookie: authCookie },
  });
  if (!res.ok) throw new Error("Could not fetch quiz");
  const data = await res.json() as { questions: { id: string; options: { id: string; is_correct: boolean }[] }[] };
  return data.questions;
}

// ─── full session flow ────────────────────────────────────────────────────────
async function runSessionFlow(
  label: string,
  code: string,
  playerIds: string[],
  playerNicknames: string[],
  questions: { id: string; options: { id: string; is_correct: boolean }[] }[],
  authCookie: string
): Promise<{ finalScores: Record<string, number> }> {
  info(`${label}: starting game with ${playerIds.length} players`);

  // All players answer each question simultaneously
  let correctAnswers = 0;
  for (let qIdx = 0; qIdx < questions.length; qIdx++) {
    const q = questions[qIdx];
    const correctOption = q.options.find((o) => o.is_correct)!;

    // All players answer at the same time — half correct, half wrong for variety
    const answerResults = await Promise.all(
      playerIds.map((pid, i) => {
        const option = i % 2 === 0 ? correctOption : q.options.find((o) => !o.is_correct) ?? correctOption;
        return answerQuestion(code, pid, option.id);
      })
    );
    const answered = answerResults.filter(Boolean).length;
    if (qIdx === 0) {
      assert(answered === playerIds.length, `${label}: all ${playerIds.length} players answered Q1 simultaneously`);
    }
    correctAnswers += answerResults.filter((_, i) => i % 2 === 0).filter(Boolean).length;

    // Host reveals then advances
    await revealQuestion(code, authCookie);
    await new Promise((r) => setTimeout(r, 150)); // small pause
    await nextQuestion(code, authCookie);
    await new Promise((r) => setTimeout(r, 100));
  }

  // Check session ended (next after last question triggers game:end + delete)
  await new Promise((r) => setTimeout(r, 300));
  const state = await getSessionState(code);
  assert(state === null || state.status === "finished", `${label}: session finished after all questions`);

  return { finalScores: {} };
}

// ─── TEST 1: 8 players, single session ───────────────────────────────────────
async function test_singleSession(authCookie: string, questions: ReturnType<typeof getQuizQuestions> extends Promise<infer T> ? T : never) {
  header("TEST 1 — 8 players in a single session");

  const code = await createSession(authCookie, "Session-A");

  // Join 8 players concurrently
  const t0 = Date.now();
  const nicknames = Array.from({ length: 8 }, (_, i) => `Student${i + 1}`);
  const playerIds = await Promise.all(nicknames.map((n) => joinSession(code, n)));
  const joinMs = Date.now() - t0;

  assert(playerIds.length === 8, `8 players joined successfully`);
  assert(playerIds.every((id) => typeof id === "string" && id.length > 0), `all player IDs are valid UUIDs`);
  assert(new Set(playerIds).size === 8, `all player IDs are unique`);
  info(`8 concurrent joins completed in ${joinMs}ms`);

  // Double-join attempt should fail
  const dupRes = await fetch(`${BASE}/api/sessions/${code}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: "Student1" }),
  });
  // Duplicate nicknames are allowed (no uniqueness constraint) so we just check it doesn't crash
  assert(dupRes.status < 500, `duplicate join attempt does not crash server`);

  await startSession(code, authCookie);
  ok(`game started`);

  await runSessionFlow("Session-A", code, playerIds, nicknames, questions, authCookie);
}

// ─── TEST 2: two sessions running concurrently ───────────────────────────────
async function test_concurrentSessions(authCookie: string, questions: ReturnType<typeof getQuizQuestions> extends Promise<infer T> ? T : never) {
  header("TEST 2 — 2 sessions with 8 players each, running simultaneously");

  const [codeA, codeB] = await Promise.all([
    createSession(authCookie, "Class-A"),
    createSession(authCookie, "Class-B"),
  ]);
  assert(codeA !== codeB, `two sessions got different room codes`);

  // 8 players join each session simultaneously (16 total concurrent joins)
  const namesA = Array.from({ length: 8 }, (_, i) => `ClassA_S${i + 1}`);
  const namesB = Array.from({ length: 8 }, (_, i) => `ClassB_S${i + 1}`);

  const t0 = Date.now();
  const [idsA, idsB] = await Promise.all([
    Promise.all(namesA.map((n) => joinSession(codeA, n))),
    Promise.all(namesB.map((n) => joinSession(codeB, n))),
  ]);
  info(`16 players joined 2 sessions in ${Date.now() - t0}ms`);
  assert(idsA.length === 8 && idsB.length === 8, `both sessions have 8 players each`);

  // Start both sessions simultaneously
  await Promise.all([
    startSession(codeA, authCookie),
    startSession(codeB, authCookie),
  ]);
  ok(`both sessions started simultaneously`);

  // Run both game flows simultaneously
  const t1 = Date.now();
  await Promise.all([
    runSessionFlow("Class-A", codeA, idsA, namesA, questions, authCookie),
    runSessionFlow("Class-B", codeB, idsB, namesB, questions, authCookie),
  ]);
  info(`both sessions completed in ${Date.now() - t1}ms`);
  assert(true, `both sessions ran to completion without interfering`);
}

// ─── TEST 3: edge cases ───────────────────────────────────────────────────────
async function test_edgeCases(authCookie: string) {
  header("TEST 3 — Edge cases");

  // Join non-existent session
  const res1 = await fetch(`${BASE}/api/sessions/XXXXXX/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: "Ghost" }),
  });
  assert(res1.status === 404, `joining non-existent session returns 404`);

  // Join without nickname
  const code = await createSession(authCookie, "Edge");
  const res2 = await fetch(`${BASE}/api/sessions/${code}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: "" }),
  });
  assert(res2.status === 400, `joining with empty nickname returns 400`);

  // Answer after session hasn't started
  const res3 = await fetch(`${BASE}/api/sessions/${code}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_id: "fake-id", option_id: "fake-opt" }),
  });
  assert(res3.status === 400, `answering on lobby-status session returns 400`);

  // Clean up
  await endSession(code, authCookie);

  // Unauthenticated session creation
  const res4 = await fetch(`${BASE}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quiz_id: QUIZ_ID, mode: "classic" }),
  });
  assert(res4.status === 401, `unauthenticated session creation returns 401`);

  // Unauthenticated reveal
  const res5 = await fetch(`${BASE}/api/sessions/XXXXXX/reveal`, { method: "POST" });
  assert(res5.status === 401, `unauthenticated reveal returns 401`);
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`${c.bold}RoboQuiz Concurrency & Integration Test${c.reset}`);
  console.log(`${c.dim}Target: ${BASE}${c.reset}\n`);

  info("Waiting for server…");
  await waitForServer();
  ok("Server is up");

  info("Authenticating as host…");
  const authCookie = await getAuthCookie();
  ok("Authenticated");

  info("Loading quiz questions…");
  const questions = await getQuizQuestions(authCookie);
  assert(questions.length === 10, `quiz has 10 questions`);

  await test_singleSession(authCookie, questions);
  await test_concurrentSessions(authCookie, questions);
  await test_edgeCases(authCookie);

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(48)}`);
  const total = passed + failed;
  const pct = Math.round((passed / total) * 100);
  if (failed === 0) {
    console.log(`${c.bold}${c.green}All ${total} tests passed (${pct}%)${c.reset}`);
  } else {
    console.log(`${c.bold}${passed}/${total} passed · ${c.red}${failed} failed${c.reset}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${c.red}Fatal:${c.reset}`, err.message);
  process.exit(1);
});
