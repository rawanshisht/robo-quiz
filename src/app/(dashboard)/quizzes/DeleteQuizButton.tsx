"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteQuizButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Delete?</span>
        <button
          onClick={handleDelete}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
    >
      Delete
    </button>
  );
}
