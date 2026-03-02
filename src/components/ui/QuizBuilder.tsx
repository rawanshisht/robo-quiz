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

const OPTION_LABELS = ["A", "B", "C", "D"];
const OPTION_STYLES = [
  { bg: "#00dcde", color: "#09090f" },
  { bg: "#ff00bf", color: "#09090f" },
  { bg: "#ff9752", color: "#09090f" },
  { bg: "#a855f7", color: "#ffffff" },
];

export default function QuizBuilder({
  quizId,
  initialTitle = "",
  initialQuestions,
}: Props) {
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
              options: q.options.map((o, j) =>
                j === oIndex ? { ...o, text } : o
              ),
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
              options: q.options.map((o, j) => ({
                ...o,
                is_correct: j === oIndex,
              })),
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
    if (!title.trim()) {
      setError("Quiz title is required");
      return;
    }
    if (questions.length === 0) {
      setError("Add at least one question");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question ${i + 1} needs a text`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (q.type === "mcq" && !q.options[j].text.trim()) {
          setError(`Question ${i + 1}, option ${j + 1} is empty`);
          return;
        }
      }
      if (!q.options.some((o) => o.is_correct)) {
        setError(`Question ${i + 1} has no correct answer`);
        return;
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
    <div className="flex flex-col gap-5">
      {/* Title */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <label
          className="block text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
        >
          Quiz Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Chapter 3 Review"
          className="w-full rounded-lg border px-4 py-3 text-base font-semibold outline-none transition-all"
          style={{
            borderColor: "var(--border)",
            color: "var(--text)",
            background: "rgba(255,255,255,0.04)",
            fontFamily: "var(--font-syne)",
            caretColor: "var(--brand-primary)",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--brand-primary)";
            e.target.style.boxShadow = "0 0 12px rgba(0,220,222,0.15)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--border)";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Questions */}
      {questions.map((q, qIndex) => (
        <div
          key={qIndex}
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          {/* Question header bar */}
          <div
            className="flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.03)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: "var(--brand-primary)", fontFamily: "var(--font-fira)" }}
              >
                Q{qIndex + 1}
              </span>
              <select
                value={q.type}
                onChange={(e) =>
                  setQuestionType(qIndex, e.target.value as QuestionType)
                }
                className="rounded-md border px-2 py-1 text-xs font-semibold outline-none"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-muted)",
                  background: "rgba(255,255,255,0.06)",
                  fontFamily: "var(--font-syne)",
                }}
              >
                <option value="mcq">Multiple choice</option>
                <option value="true_false">True / False</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => moveQuestion(qIndex, -1)}
                disabled={qIndex === 0}
                className="w-7 h-7 flex items-center justify-center rounded text-base transition-colors hover:bg-white/10 disabled:opacity-25"
                style={{ color: "var(--text-muted)" }}
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => moveQuestion(qIndex, 1)}
                disabled={qIndex === questions.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded text-base transition-colors hover:bg-white/10 disabled:opacity-25"
                style={{ color: "var(--text-muted)" }}
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => removeQuestion(qIndex)}
                className="w-7 h-7 flex items-center justify-center rounded text-base text-red-500 transition-colors hover:bg-red-900/30 ml-1"
                title="Remove question"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-5">
            {/* Question text */}
            <textarea
              value={q.text}
              onChange={(e) => setQuestionText(qIndex, e.target.value)}
              placeholder="Type your question here…"
              rows={2}
              className="mb-4 w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all resize-none"
              style={{
                borderColor: "var(--border)",
                color: "var(--text)",
                background: "rgba(255,255,255,0.04)",
                fontFamily: "var(--font-syne)",
                caretColor: "var(--brand-primary)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--brand-primary)";
                e.target.style.boxShadow = "0 0 12px rgba(0,220,222,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />

            {/* Image upload */}
            <div className="mb-4">
              {q.image_url ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={q.image_url}
                    alt="Question"
                    className="h-16 w-24 rounded-lg object-cover border"
                    style={{ borderColor: "var(--border)" }}
                  />
                  <button
                    onClick={() => removeImage(qIndex)}
                    className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <label
                  className="inline-flex items-center gap-1 cursor-pointer text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "var(--brand-primary)", fontFamily: "var(--font-syne)" }}
                >
                  + Add image
                  <input
                    ref={(el) => {
                      fileRefs.current[qIndex] = el;
                    }}
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
            <div className="flex flex-col gap-2.5">
              {q.options.map((opt, oIndex) => {
                const style = OPTION_STYLES[oIndex % OPTION_STYLES.length];
                return (
                  <div key={oIndex} className="flex items-center gap-3">
                    {/* Color dot */}
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black cursor-pointer transition-all"
                      style={{
                        background: style.bg,
                        color: style.color,
                        opacity: opt.is_correct ? 1 : 0.3,
                        transform: opt.is_correct ? "scale(1.15)" : "scale(1)",
                        boxShadow: opt.is_correct
                          ? `0 0 12px ${style.bg}88`
                          : "none",
                      }}
                      onClick={() => setCorrectOption(qIndex, oIndex)}
                      title="Mark as correct"
                    >
                      {OPTION_LABELS[oIndex]}
                    </div>

                    {q.type === "true_false" ? (
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--text)", fontFamily: "var(--font-syne)" }}
                      >
                        {opt.text}
                      </span>
                    ) : (
                      <input
                        value={opt.text}
                        onChange={(e) =>
                          setOptionText(qIndex, oIndex, e.target.value)
                        }
                        placeholder={`Option ${OPTION_LABELS[oIndex]}`}
                        className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition-all"
                        style={{
                          borderColor: "var(--border)",
                          color: "var(--text)",
                          background: "rgba(255,255,255,0.04)",
                          fontFamily: "var(--font-syne)",
                          caretColor: style.bg,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = style.bg;
                          e.target.style.boxShadow = `0 0 10px ${style.bg}30`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "var(--border)";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    )}

                    {opt.is_correct && (
                      <span
                        className="text-xs font-bold ml-1"
                        style={{ color: "var(--brand-primary)", fontFamily: "var(--font-syne)" }}
                      >
                        ✓ correct
                      </span>
                    )}
                  </div>
                );
              })}
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
              >
                Click the colored circle to mark the correct answer.
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Add question */}
      <button
        onClick={addQuestion}
        className="rounded-xl border-2 border-dashed py-5 text-sm font-semibold transition-all"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-muted)",
          fontFamily: "var(--font-syne)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--brand-primary)";
          (e.currentTarget as HTMLElement).style.color = "var(--brand-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
        }}
      >
        + Add question
        {questions.length > 0 && (
          <span className="ml-2 opacity-50">({questions.length} so far)</span>
        )}
      </button>

      {error && (
        <p
          className="text-sm font-medium rounded-xl px-4 py-3 border"
          style={{
            background: "rgba(239,68,68,0.08)",
            borderColor: "rgba(239,68,68,0.25)",
            color: "#fca5a5",
            fontFamily: "var(--font-syne)",
          }}
        >
          {error}
        </p>
      )}

      {/* Save */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-xl text-sm font-black transition-all hover:opacity-90 disabled:opacity-40 active:scale-95"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
            color: "#09090f",
            fontFamily: "var(--font-syne)",
            boxShadow: "0 4px 20px rgba(0,220,222,0.25)",
          }}
        >
          {saving ? "Saving…" : quizId ? "Save changes" : "Create quiz"}
        </button>
      </div>
    </div>
  );
}
