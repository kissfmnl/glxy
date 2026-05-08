"use client";

import { type ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
};

export function ConfirmSubmitButton({ confirmMessage, onClick, ...rest }: Props) {
  return (
    <button
      {...rest}
      onClick={(e) => {
        const ok = window.confirm(confirmMessage);
        if (!ok) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    />
  );
}
