"use client";

import { useMemo, useState } from "react";

type Row = { question: string; answer: string };

function parseInitial(raw: string | null | undefined): Row[] {
  if (!raw?.trim()) return [{ question: "", answer: "" }];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return [{ question: "", answer: "" }];
    return arr.map((r: any) => ({
      question: String(r?.question ?? ""),
      answer: String(r?.answer ?? ""),
    }));
  } catch {
    return [{ question: "", answer: "" }];
  }
}

export function AdminJockFactsEditor({
  initialJson,
  inputName = "personalFactsJson",
}: {
  initialJson: string | null | undefined;
  inputName?: string;
}) {
  const [rows, setRows] = useState<Row[]>(() => parseInitial(initialJson));

  const jsonOut = useMemo(() => {
    const cleaned = rows
      .map((r) => ({
        question: r.question.trim(),
        answer: r.answer.trim(),
      }))
      .filter((r) => r.question || r.answer);
    return cleaned.length ? JSON.stringify(cleaned) : "";
  }, [rows]);

  function addRow() {
    setRows((r) => [...r, { question: "", answer: "" }]);
  }

  function removeRow(i: number) {
    setRows((r) => (r.length <= 1 ? [{ question: "", answer: "" }] : r.filter((_, j) => j !== i)));
  }

  return (
    <div className="md:col-span-2 space-y-3">
      <input type="hidden" name={inputName} value={jsonOut} readOnly />
      <div className="flex items-center justify-between gap-2">
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Fun facts (persoonlijk)</label>
        <button
          type="button"
          onClick={addRow}
          className="text-[10px] font-black uppercase text-brand-primary hover:underline"
        >
          + Vraag & antwoord
        </button>
      </div>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-white/10 p-3 space-y-2 bg-gray-50/80 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black text-gray-400">Fun fact {i + 1}</span>
              {rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="text-[10px] font-black text-red-500 hover:underline"
                >
                  Verwijder
                </button>
              ) : null}
            </div>
            <input
              type="text"
              value={row.question}
              onChange={(e) => {
                const v = e.target.value;
                setRows((prev) => prev.map((x, j) => (j === i ? { ...x, question: v } : x)));
              }}
              placeholder="Vraag"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold"
            />
            <textarea
              value={row.answer}
              onChange={(e) => {
                const v = e.target.value;
                setRows((prev) => prev.map((x, j) => (j === i ? { ...x, answer: v } : x)));
              }}
              placeholder="Antwoord"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold resize-y min-h-[72px]"
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-500 font-bold">Lege rijen worden niet opgeslagen.</p>
    </div>
  );
}
