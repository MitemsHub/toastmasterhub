import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";

type EvaluatorListItem = {
  id: string;
  name: string;
  email: string;
  profile: string;
  photoUrl: string;
  createdAt: string;
};

export function EvaluatorDirectory({
  evaluators,
}: {
  evaluators: EvaluatorListItem[];
}) {
  if (evaluators.length === 0) {
    return (
      <Reveal>
        <section className="rounded-[1.5rem] border border-dashed border-[#d8cebf] bg-white p-6 text-center text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)] sm:p-6">
          <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent)] uppercase">
            Recent profiles
          </p>
          <h2 className="text-balance mt-2 text-2xl font-semibold tracking-[-0.05em] text-zinc-950">
            No evaluator requests yet
          </h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            The first request you send will appear here.
          </p>
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
              Recent profiles
            </p>
            <h2 className="text-balance mt-2 text-2xl font-semibold tracking-[-0.05em] text-zinc-950">
              Recently created evaluators
            </h2>
          </div>
          <p className="text-sm text-zinc-500">{evaluators.length} profiles</p>
        </div>

        <div className="mt-6 grid gap-3">
          {evaluators.map((evaluator) => (
            <article
              key={evaluator.id}
              className="grid gap-4 rounded-[1.2rem] border border-[#e6ddd1] bg-[#fcfaf7] p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
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
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  {evaluator.profile}
                </p>
              </div>
              {evaluator.createdAt ? (
                <p className="text-[11px] tracking-[0.22em] text-zinc-400 uppercase sm:text-right">
                  Added {evaluator.createdAt.slice(0, 10)}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
