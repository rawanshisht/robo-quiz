"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { QuestionType } from "@/types";

interface OptionDraft {
  text: string;
  is_correct: boolean;
}

interface QuestionDraft {
  type: QuestionType;
  text: string;
  image_url: string | null;
  options: OptionDraft[];
}

function defaultOptions(type: QuestionType): OptionDraft[] {
  if (type === "true_false") {
    return [
      { text: "True", is_correct: true },
      { text: "False", is_correct: false },
    ];
  }
  return [
    { text: "", is_correct: true },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
  ];
}

interface Props {
  quizId?: string;
  initialTitle?: string;
  initialQuestions?: QuestionDraft[];
}

export default function QuizBuilder({ quizId, initialTitle = "", initialQuestions }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialQuestions ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { type: "mcq", text: "", image_url: null, options: defaultOptions("mcq") },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function moveQuestion(index: number, dir: -1 | 1) {
    setQuestions((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function setQuestionType(index: number, type: QuestionType) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === index ? { ...q, type, options: defaultOptions(type) } : q
      )
    );
  }

  function setQuestionText(index: number, text: string) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, text } : q))
    );
  }

  function setOptionText(qIndex: number, oIndex: number, text: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((o, j) => (j === oIndex ? { ...o, text } : o)),
            }
          : q
      )
    );
  }

  function setCorrectOption(qIndex: number, oIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((o, j) => ({ ...o, is_correct: j === oIndex })),
            }
          : q
      )
    );
  }

  async function handleImageUpload(qIndex: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Image upload failed");
      return;
    }
    const { url } = await res.json();
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, image_url: url } : q))
    );
  }

  function removeImage(qIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, image_url: null } : q))
    );
    if (fileRefs.current[qIndex]) fileRefs.current[qIndex]!.value = "";
  }

  async function handleSave() {
    setError("");
    if (!title.trim()) { setError("Quiz title is required"); return; }
    if (questions.length === 0) { setError("Add at least one question"); return; }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) { setError(`Question ${i + 1} needs a text`); return; }
      for (let j = 0; j < q.options.length; j++) {
        if (q.type === "mcq" && !q.options[j].text.trim()) {
          setError(`Question ${i + 1}, option ${j + 1} is empty`); return;
        }
      }
      if (!q.options.some((o) => o.is_correct)) {
        setError(`Question ${i + 1} has no correct answer`); return;
      }
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      questions: questions.map((q, i) => ({ ...q, order: i })),
    };

    const res = quizId
      ? await fetch(`/api/quizzes/${quizId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save quiz");
      return;
    }

    router.push("/quizzes");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Quiz title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Chapter 3 Review"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Questions */}
      {questions.map((q, qIndex) => (
        <div
          key={qIndex}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          {/* Question header */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-gray-500">
              Question {qIndex + 1}
            </span>
            <div className="flex items-center gap-2">
              <select
                value={q.type}
                onChange={(e) => setQuestionType(qIndex, e.target.value as QuestionType)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="mcq">Multiple choice</option>
                <option value="true_false">True / False</option>
              </select>
              <button
                onClick={() => moveQuestion(qIndex, -1)}
                disabled={qIndex === 0}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => moveQuestion(qIndex, 1)}
                disabled={qIndex === questions.length - 1}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => removeQuestion(qIndex)}
                className="rounded p-1 text-red-400 hover:bg-red-50"
                title="Remove question"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Question text */}
          <textarea
            value={q.text}
            onChange={(e) => setQuestionText(qIndex, e.target.value)}
            placeholder="Question text"
            rows={2}
            className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {/* Image upload */}
          <div className="mb-4">
            {q.image_url ? (
              <div className="flex items-center gap-3">
                <img
                  src={q.image_url}
                  alt="Question"
                  className="h-20 w-32 rounded-lg object-cover border border-gray-200"
                />
                <button
                  onClick={() => removeImage(qIndex)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <label className="cursor-pointer text-sm text-blue-600 hover:underline">
                + Add image
                <input
                  ref={(el) => { fileRefs.current[qIndex] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(qIndex, file);
                  }}
                />
              </label>
            )}
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2">
            {q.options.map((opt, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qIndex}`}
                  checked={opt.is_correct}
                  onChange={() => setCorrectOption(qIndex, oIndex)}
                  className="accent-blue-600"
                  title="Mark as correct"
                />
                {q.type === "true_false" ? (
                  <span className="text-sm text-gray-700">{opt.text}</span>
                ) : (
                  <input
                    value={opt.text}
                    onChange={(e) => setOptionText(qIndex, oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                )}
              </div>
            ))}
            <p className="text-xs text-gray-400">
              Select the radio button next to the correct answer.
            </p>
          </div>
        </div>
      ))}

      {/* Add question */}
      <button
        onClick={addQuestion}
        className="rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-gray-400 hover:border-blue-300 hover:text-blue-500"
      >
        + Add question
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : quizId ? "Save changes" : "Create quiz"}
        </button>
      </div>
    </div>
  );
}
