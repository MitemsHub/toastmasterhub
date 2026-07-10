import { cookies } from "next/headers";
import { Reveal } from "@/components/motion/reveal";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import { summarizeInvitationStatuses, listInvitationStatusItems } from "@/lib/invitations/service";
import { VPE_SESSION_COOKIE } from "@/lib/auth/vpe-session";
import { getAuthenticatedVpe } from "@/lib/vpe/service";

const quickLinks = [
  {
    href: "/admin/evaluators",
    label: "Create evaluator",
    description: "Start a new evaluator confirmation request and send it immediately.",
  },
  {
    href: "/admin/invitations",
    label: "View confirmations",
    description: "Review the response board, update dates, and cancel requests when plans change.",
  },
];

export default async function AdminPage() {
  const cookieStore = await cookies();
  let vpeName = "";
  let summary = { pending: 0, confirmed: 0, declined: 0 };
  const pb = await getAppwriteAdmin();
  const vpe = await getAuthenticatedVpe(pb, cookieStore.get(VPE_SESSION_COOKIE)?.value);

  if (!vpe) {
    return null;
  }

  vpeName = vpe.name;
  const invitations = await listInvitationStatusItems(pb, vpe.id);
  summary = summarizeInvitationStatuses(invitations);

  if (!vpeName) {
    return null;
  }

  return (
    <section className="grid gap-6">
      <Reveal>
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-[1.35rem] border border-[#e6ddd1] bg-white p-4 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)]">
            <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">Pending</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">{summary.pending}</p>
            <p className="mt-1 text-sm text-zinc-500">Awaiting evaluator response</p>
          </article>
          <article className="rounded-[1.35rem] border border-[#e6ddd1] bg-white p-4 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)]">
            <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">Confirmed</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">{summary.confirmed}</p>
            <p className="mt-1 text-sm text-zinc-500">Ready for the meeting date</p>
          </article>
          <article className="rounded-[1.35rem] border border-[#e6ddd1] bg-white p-4 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)]">
            <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">Declined</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">{summary.declined}</p>
            <p className="mt-1 text-sm text-zinc-500">Needs a new date or request</p>
          </article>
        </div>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <Reveal>
          <section className="rounded-[1.5rem] border border-[#e6ddd1] bg-white p-5 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)] sm:p-6">
            <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent)] uppercase">
              Workspace
            </p>
            <h2 className="mt-2 max-w-2xl text-balance text-2xl font-semibold tracking-[-0.05em] text-zinc-950">
              Keep requests moving without repeating work.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-600">
              Create evaluator requests, track replies, and reschedule only the meeting date when plans change for {vpeName}.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.1rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 py-3 text-sm text-zinc-600">
                Send the request once
              </div>
              <div className="rounded-[1.1rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 py-3 text-sm text-zinc-600">
                Track the reply cleanly
              </div>
              <div className="rounded-[1.1rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 py-3 text-sm text-zinc-600">
                Reschedule the date only
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.08}>
          <section className="rounded-[1.5rem] border border-[#e6ddd1] bg-white p-5 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)] sm:p-6">
            <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent)] uppercase">
              Actions
            </p>
            <div className="mt-4 grid gap-3">
              {quickLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-[1.2rem] border border-[#e6ddd1] bg-[#fcfaf7] p-4 hover:-translate-y-0.5 hover:border-[var(--accent)]/30"
                >
                  <p className="text-base font-semibold tracking-[-0.03em] text-zinc-950">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{item.description}</p>
                </a>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </section>
  );
}
