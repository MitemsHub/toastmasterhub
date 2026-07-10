"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  children: ReactNode;
  className: string;
  pendingLabel?: string;
  name?: string;
  value?: string;
};

export function PendingSubmitButton({
  children,
  className,
  pendingLabel,
  name,
  value,
}: PendingSubmitButtonProps) {
  const { pending, data } = useFormStatus();
  const isCurrentAction =
    pending &&
    (!name ||
      !data ||
      (typeof data.get(name) === "string" && String(data.get(name)) === String(value ?? "")));
  const visibleLabel = isCurrentAction ? pendingLabel ?? children : children;

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-disabled={pending}
      className={`${className} disabled:cursor-wait disabled:opacity-90`}
    >
      <span className="inline-flex items-center gap-2">
        {isCurrentAction ? (
          <motion.span
            aria-hidden="true"
            className="h-4 w-4 rounded-full border-2 border-current/25 border-t-current"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        ) : null}
        <span>{visibleLabel}</span>
      </span>
    </button>
  );
}
