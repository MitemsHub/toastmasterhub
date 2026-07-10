"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

type EvaluatorOption = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile: string;
  photoUrl: string;
};

type ConfirmationRequestFormProps = {
  action?: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
  successMessage?: string;
  evaluators: EvaluatorOption[];
};

export function ConfirmationRequestForm({
  action,
  errorMessage,
  successMessage,
  evaluators,
}: ConfirmationRequestFormProps) {
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState("");
  const selectedEvaluator = useMemo(
    () => evaluators.find((evaluator) => evaluator.id === selectedEvaluatorId) ?? null,
    [evaluators, selectedEvaluatorId],
  );

  return (
    <Reveal>
      <form
        action={action}
        className="rounded-[1.5rem] border border-[#e6ddd1] bg-white p-5 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)] sm:p-6"
      >
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent)] uppercase">
            Select evaluator
          </p>
          <h2 className="text-balance mt-2 text-2xl font-semibold tracking-[-0.05em] text-zinc-950">
            Choose a shared evaluator and send the request.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-600">
            Pick any evaluator from the shared directory, then complete only the meeting details for this request.
          </p>
        </div>

        {errorMessage ? (
          <p className="mt-6 rounded-[1.1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900 shadow-[0_16px_40px_-30px_rgba(190,24,93,0.35)]">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="mt-5 rounded-[1.1rem] border border-emerald-300/24 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
              <label className="grid min-w-0 gap-2 text-sm font-medium text-zinc-800">
                <span>Evaluator</span>
                <select
                  name="evaluatorId"
                  required
                  value={selectedEvaluatorId}
                  onChange={(event) => setSelectedEvaluatorId(event.target.value)}
                  className="h-11 rounded-[0.95rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 outline-none focus:border-[var(--accent)]"
                >
                  <option value="">Select evaluator</option>
                  {evaluators.map((evaluator) => (
                    <option key={evaluator.id} value={evaluator.id}>
                      {evaluator.name} - {evaluator.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid min-w-0 gap-2 text-sm font-medium text-zinc-800">
                <span>{selectedEvaluator ? "Replace portrait" : "Evaluator portrait"}</span>
                <input
                  name="photo"
                  type="file"
                  accept="image/*"
                  className="w-full rounded-[0.95rem] border border-dashed border-[#d8cebf] bg-[#fcfaf7] px-4 py-3 text-sm text-zinc-500 file:mr-3 file:border-0 file:bg-transparent file:font-medium file:text-zinc-700"
                />
              </label>
            </div>

            {selectedEvaluator ? (
              <div className="grid gap-4 rounded-[1.1rem] border border-[#e6ddd1] bg-[#fcfaf7] p-4">
                <div className="flex items-center gap-4">
                  <Image
                    src={selectedEvaluator.photoUrl}
                    alt={selectedEvaluator.name}
                    width={72}
                    height={72}
                    className="h-[4.5rem] w-[4.5rem] rounded-[1rem] object-cover shadow-[0_18px_34px_-22px_rgba(15,23,42,0.22)]"
                  />
                  <div className="min-w-0">
                    <p className="text-base font-semibold tracking-[-0.03em] text-zinc-950">
                      {selectedEvaluator.name}
                    </p>
                    <p className="text-sm text-[var(--accent)]">{selectedEvaluator.email}</p>
                    {selectedEvaluator.phone ? (
                      <p className="text-sm text-zinc-500">{selectedEvaluator.phone}</p>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-2 text-sm text-zinc-600">
                  <p className="font-medium text-zinc-800">Evaluator profile</p>
                  <p className="leading-6">{selectedEvaluator.profile}</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-zinc-800">
              <span>Meeting date</span>
              <input
                name="meetingDate"
                type="date"
                required
                className="h-11 rounded-[0.95rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 outline-none focus:border-[var(--accent)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-zinc-800">
              <span>Meeting title</span>
              <input
                name="meetingTitle"
                type="text"
                required
                placeholder="Toastmasters club meeting"
                className="h-11 rounded-[0.95rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-zinc-800 lg:col-span-2">
              <span>Meeting note</span>
              <textarea
                name="meetingNote"
                rows={3}
                placeholder="Optional context for the evaluator."
                className="rounded-[0.95rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 py-3 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <PendingSubmitButton
            pendingLabel="Sending for confirmation..."
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-zinc-800 sm:ml-auto"
          >
            Send for confirmation
          </PendingSubmitButton>
        </div>
      </form>
    </Reveal>
  );
}
