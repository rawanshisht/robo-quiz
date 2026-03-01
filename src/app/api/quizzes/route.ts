import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllQuizzes, createQuiz } from "@/lib/db/quizzes";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quizzes = await getAllQuizzes();
  return NextResponse.json(quizzes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, questions } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!questions?.length) {
    return NextResponse.json({ error: "At least one question is required" }, { status: 400 });
  }

  const id = await createQuiz(title.trim(), session.user.id, questions);
  return NextResponse.json({ id }, { status: 201 });
}
