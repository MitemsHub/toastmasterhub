"use client";

import { useState } from "react";
import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

type EvaluatorListItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile: string;
  photoUrl: string;
  createdAt: string;
};

type EvaluatorDirectoryProps = {
  evaluators: EvaluatorListItem[];
  updateAction?: (formData: FormData) => void | Promise<void>;
  deleteAction?: (formData: FormData) => void | Promise<void>;
};

function EvaluatorCard({
  evaluator,
  updateAction,
  deleteAction,
}: {
  evaluator: EvaluatorListItem;
  updateAction?: (formData: FormData) => void | Promise<void>;
  deleteAction?: (formData: FormData) => void | Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (isEditing) {
    return (
      <form
        action={async (formData) => {
          await updateAction?.(formData);
          setIsEditing(false);
        }}
        className="grid gap-4 rounded-[1.2rem] border border-[#e6ddd1] bg-[#fcfaf7] p-4"
      >
        <input type="hidden" name="evaluatorId" value={evaluator.id} />
        <div className="flex items-center gap-4">
          <Image
            src={evaluator.photoUrl}
            alt={evaluator.name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-[1rem] object-cover shadow-[0_18px_34px_-22px_rgba(15,23,42,0.22)]"
          />
          {evaluator.createdAt ? (
            <p className="text-sm text-zinc-500">Added {evaluator.createdAt.slice(0, 10)}</p>
          ) : null}
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            <span>Name</span>
            <input
              name="fullName"
              type="text"
              defaultValue={evaluator.name}
              required
              className="h-11 rounded-[0.95rem] border border-[#e6ddd1] bg-white px-4 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            <span>Email</span>
            <input
              name="email"
              type="email"
              defaultValue={evaluator.email}
              required
              className="h-11 rounded-[0.95rem] border border-[#e6ddd1] bg-white px-4 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            <span>Phone number</span>
            <input
              name="phone"
              type="tel"
              defaultValue={evaluator.phone}
              required
              className="h-11 rounded-[0.95rem] border border-[#e6ddd1] bg-white px-4 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            <span>Profile</span>
            <textarea
              name="profile"
              rows={3}
              defaultValue={evaluator.profile}
              required
              className="rounded-[0.95rem] border border-[#e6ddd1] bg-white px-4 py-3 outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#e6ddd1] bg-white px-4 text-sm font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"
          >
            Cancel
          </button>
          <PendingSubmitButton
            pendingLabel="Saving..."
            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-zinc-800"
          >
            Save
          </PendingSubmitButton>
        </div>
      </form>
    );
  }

  return (
    <article className="grid gap-4 rounded-[1.2rem] border border-[#e6ddd1] bg-[#fcfaf7] p-4">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <Image
          src={evaluator.photoUrl}
          alt={evaluator.name}
          width={64}
          height={64}
          className="h-16 w-16 rounded-[1rem] object-cover shadow-[0_18px_34px_-22px_rgba(15,23,42,0.22)]"
        />
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-[-0.03em] text-zinc-950">
            {evaluator.name}
          </h3>
          <p className="text-sm text-[var(--accent)]">{evaluator.email}</p>
          {evaluator.phone ? <p className="text-sm text-zinc-500">{evaluator.phone}</p> : null}
          <p className="mt-1 text-sm leading-6 text-zinc-600">{evaluator.profile}</p>
        </div>
        <div className="grid gap-3 sm:justify-items-end">
          {evaluator.createdAt ? (
            <p className="text-[11px] tracking-[0.22em] text-zinc-400 uppercase sm:text-right">
              Added {evaluator.createdAt.slice(0, 10)}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsConfirmingDelete(false);
                setIsEditing(true);
              }}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#e6ddd1] bg-white px-4 text-sm font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="inline-flex h-10 items-center justify-center rounded-full border border-rose-200 bg-white px-4 text-sm font-medium text-rose-700 hover:-translate-y-0.5 hover:border-rose-300"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {isConfirmingDelete ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-medium text-rose-900">
            Delete {evaluator.name} from the shared evaluator directory?
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#e6ddd1] bg-white px-4 text-sm font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"
            >
              Cancel
            </button>
            <form action={deleteAction}>
              <input type="hidden" name="evaluatorId" value={evaluator.id} />
              <PendingSubmitButton
                pendingLabel="Deleting..."
                className="inline-flex h-10 items-center justify-center rounded-full bg-rose-700 px-4 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-rose-800"
              >
                Delete evaluator
              </PendingSubmitButton>
            </form>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function EvaluatorDirectory({
  evaluators,
  updateAction,
  deleteAction,
}: EvaluatorDirectoryProps) {
  if (evaluators.length === 0) {
    return (
      <Reveal>
        <section className="rounded-[1.5rem] border border-dashed border-[#d8cebf] bg-white p-6 text-center text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)] sm:p-6">
          <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent)] uppercase">
            Shared directory
          </p>
          <h2 className="text-balance mt-2 text-2xl font-semibold tracking-[-0.05em] text-zinc-950">
            No shared evaluators yet
          </h2>
        </section>
      </Reveal>
    );
  }

  return (
    <Reveal>
      <section className="rounded-[1.5rem] border border-[#e6ddd1] bg-white p-5 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)] sm:p-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent)] uppercase">
              Shared directory
            </p>
            <h2 className="text-balance mt-2 text-2xl font-semibold tracking-[-0.05em] text-zinc-950">
              Shared evaluator directory
            </h2>
          </div>
          <p className="text-sm text-zinc-500">{evaluators.length} shared profiles</p>
        </div>

        <div className="mt-6 grid gap-3">
          {evaluators.map((evaluator) => (
            <EvaluatorCard
              key={evaluator.id}
              deleteAction={deleteAction}
              evaluator={evaluator}
              updateAction={updateAction}
            />
          ))}
        </div>
      </section>
    </Reveal>
  );
}
