import { Reveal } from "@/components/motion/reveal";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

type EvaluatorImportFormProps = {
  action?: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
  successMessage?: string;
};

export function EvaluatorImportForm({
  action,
  errorMessage,
  successMessage,
}: EvaluatorImportFormProps) {
  return (
    <Reveal delay={0.06}>
      <form
        action={action}
        className="rounded-[1.5rem] border border-[#e6ddd1] bg-white p-5 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)] sm:p-6"
      >
        <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent)] uppercase">
          Bulk upload
        </p>
        <h2 className="text-balance mt-2 text-2xl font-semibold tracking-[-0.05em] text-zinc-950">
          Import evaluators with the template.
        </h2>
        <p className="mt-2 text-sm leading-7 text-zinc-600">
          Download the CSV template and fill it with evaluator details.
        </p>

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

        <div className="mt-5 grid gap-4">
          <a
            href="/templates/evaluators-import-template.csv"
            download
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#e6ddd1] bg-[#fcfaf7] px-5 text-sm font-semibold text-zinc-700 hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:text-zinc-950"
          >
            Download CSV template
          </a>

          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            <span>CSV upload</span>
            <input
              name="csvFile"
              type="file"
              accept=".csv,text/csv"
              required
              className="rounded-[0.95rem] border border-dashed border-[#d8cebf] bg-[#fcfaf7] px-4 py-3 text-sm text-zinc-500"
            />
          </label>
          <p className="text-sm text-zinc-500">Include name, email, phone number, and profile.</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <PendingSubmitButton
            pendingLabel="Importing evaluators..."
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-zinc-800 sm:ml-auto"
          >
            Upload evaluators
          </PendingSubmitButton>
        </div>
      </form>
    </Reveal>
  );
}
