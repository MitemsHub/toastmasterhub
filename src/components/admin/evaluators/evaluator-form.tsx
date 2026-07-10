import { Reveal } from "@/components/motion/reveal";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

type EvaluatorFormProps = {
  action?: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
  successMessage?: string;
};

export function EvaluatorForm({
  action,
  errorMessage,
  successMessage,
}: EvaluatorFormProps) {
  return (
    <Reveal>
      <form
        action={action}
        className="rounded-[1.5rem] border border-[#e6ddd1] bg-white p-5 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)] sm:p-6"
      >
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent)] uppercase">
            Shared directory
          </p>
          <h2 className="text-balance mt-2 text-2xl font-semibold tracking-[-0.05em] text-zinc-950">
            Add evaluator details once.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-600">
            Save an evaluator into the shared directory so every VPE can reuse the same profile later.
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

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            <span>Evaluator name</span>
            <input
              name="fullName"
              type="text"
              placeholder="e.g. Amina Bello"
              className="h-11 rounded-[0.95rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            <span>Evaluator email</span>
            <input
              name="email"
              type="email"
              placeholder="e.g. amina@example.com"
              className="h-11 rounded-[0.95rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            <span>Phone number</span>
            <input
              name="phone"
              type="tel"
              placeholder="e.g. +2348012345678"
              className="h-11 rounded-[0.95rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-800 lg:col-span-2">
            <span>Evaluator profile</span>
            <textarea
              name="profile"
              rows={3}
              placeholder="Short profile or role context."
              className="rounded-[0.95rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 py-3 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            <span>Evaluator portrait</span>
            <input
              name="photo"
              type="file"
              accept="image/*"
              required
              className="rounded-[0.95rem] border border-dashed border-[#d8cebf] bg-[#fcfaf7] px-4 py-3 text-sm text-zinc-500"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            This saves the evaluator profile only. Use the request form above when you are ready to send.
          </p>
          <PendingSubmitButton
            pendingLabel="Saving evaluator..."
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-zinc-800"
          >
            Add to shared directory
          </PendingSubmitButton>
        </div>
      </form>
    </Reveal>
  );
}
