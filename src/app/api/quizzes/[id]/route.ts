import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuizById, updateQuiz, deleteQuiz } from "@/lib/db/quizzes";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quiz = await getQuizById(id);
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(quiz);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, questions } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!questions?.length) {
    return NextResponse.json({ error: "At least one question is required" }, { status: 400 });
  }

  try {
    await updateQuiz(id, title.trim(), questions);
  } catch (err) {
    console.error("updateQuiz failed:", err);
    return NextResponse.json({ error: "Failed to save quiz" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteQuiz(id);
  return NextResponse.json({ ok: true });
}
