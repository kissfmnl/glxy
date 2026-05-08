"use client";

import type { ReactNode } from "react";

function toNodes(input: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  let idx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    if (m.index > idx) out.push(input.slice(idx, m.index));
    const label = m[1];
    const href = m[2];
    const external = /^https?:\/\//i.test(href);
    out.push(
      <a
        key={`${href}-${m.index}`}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="font-black text-brand-primary underline underline-offset-2 hover:opacity-80"
      >
        {label}
      </a>
    );
    idx = m.index + m[0].length;
  }
  if (idx < input.length) out.push(input.slice(idx));
  return out;
}

export function RichTextWithLinks({ text, className = "" }: { text: string; className?: string }) {
  if (!text?.trim()) return null;
  const lines = text.split("\n");
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <p key={i} className={i > 0 ? "mt-2" : ""}>
          {toNodes(line)}
        </p>
      ))}
    </div>
  );
}
