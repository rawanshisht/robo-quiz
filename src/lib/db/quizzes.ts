import { sql } from "./index";
import type { Quiz, Question, Option } from "@/types";

export async function getAllQuizzes(): Promise<Quiz[]> {
  const rows = await sql`
    SELECT id, title, created_by, created_at, updated_at
    FROM quizzes
    ORDER BY updated_at DESC
  `;
  return rows as Quiz[];
}

export async function getQuizById(
  id: string
): Promise<(Quiz & { questions: Question[] }) | null> {
  const quizRows = await sql`
    SELECT id, title, created_by, created_at, updated_at
    FROM quizzes WHERE id = ${id}
  `;
  if (!quizRows[0]) return null;

  const questionRows = await sql`
    SELECT id, quiz_id, type, text, image_url, "order"
    FROM questions
    WHERE quiz_id = ${id}
    ORDER BY "order" ASC
  `;

  const optionRows =
    questionRows.length > 0
      ? await sql`
          SELECT id, question_id, text, is_correct
          FROM options
          WHERE question_id = ANY(${questionRows.map((q) => q.id)})
        `
      : [];

  const questions = (questionRows as Question[]).map((q) => ({
    ...q,
    options: (optionRows as Option[]).filter((o) => o.question_id === q.id),
  }));

  return { ...(quizRows[0] as Quiz), questions };
}

export async function createQuiz(
  title: string,
  createdBy: string,
  questions: {
    type: string;
    text: string;
    image_url: string | null;
    order: number;
    options: { text: string; is_correct: boolean }[];
  }[]
): Promise<string> {
  const result = await sql`
    INSERT INTO quizzes (title, created_by)
    VALUES (${title}, ${createdBy})
    RETURNING id
  `;
  const quizId = (result[0] as { id: string }).id;

  for (const q of questions) {
    const qResult = await sql`
      INSERT INTO questions (quiz_id, type, text, image_url, "order")
      VALUES (${quizId}, ${q.type}, ${q.text}, ${q.image_url}, ${q.order})
      RETURNING id
    `;
    const questionId = (qResult[0] as { id: string }).id;

    for (const opt of q.options) {
      await sql`
        INSERT INTO options (question_id, text, is_correct)
        VALUES (${questionId}, ${opt.text}, ${opt.is_correct})
      `;
    }
  }

  return quizId;
}

export async function updateQuiz(
  id: string,
  title: string,
  questions: {
    type: string;
    text: string;
    image_url: string | null;
    order: number;
    options: { text: string; is_correct: boolean }[];
  }[]
): Promise<void> {
  await sql`UPDATE quizzes SET title = ${title}, updated_at = NOW() WHERE id = ${id}`;
  await sql`DELETE FROM questions WHERE quiz_id = ${id}`;

  for (const q of questions) {
    const qResult = await sql`
      INSERT INTO questions (quiz_id, type, text, image_url, "order")
      VALUES (${id}, ${q.type}, ${q.text}, ${q.image_url}, ${q.order})
      RETURNING id
    `;
    const questionId = (qResult[0] as { id: string }).id;

    for (const opt of q.options) {
      await sql`
        INSERT INTO options (question_id, text, is_correct)
        VALUES (${questionId}, ${opt.text}, ${opt.is_correct})
      `;
    }
  }
}

export async function deleteQuiz(id: string): Promise<void> {
  await sql`DELETE FROM quizzes WHERE id = ${id}`;
}
