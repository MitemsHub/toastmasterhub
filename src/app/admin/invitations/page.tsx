import { cookies } from "next/headers";
import { InvitationStatusList } from "@/components/admin/invitations/invitation-status-list";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import { redirect } from "@/lib/next/navigation";
import { listInvitationStatusItems, summarizeInvitationStatuses } from "@/lib/invitations/service";
import { VPE_SESSION_COOKIE } from "@/lib/auth/vpe-session";
import { getAuthenticatedVpe } from "@/lib/vpe/service";

type InvitationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type FilterValue = "all" | "pending" | "accepted" | "declined";

const filters: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Confirmed" },
  { value: "declined", label: "Declined" },
];

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getActiveFilter(value: string | undefined): FilterValue {
  if (value === "pending" || value === "accepted" || value === "declined") {
    return value;
  }

  return "all";
}

export default async function InvitationsPage({ searchParams }: InvitationsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeFilter = getActiveFilter(getSearchParamValue(resolvedSearchParams.status));
  const selectedInvitationId = getSearchParamValue(resolvedSearchParams.edit);
  const successMessage =
    getSearchParamValue(resolvedSearchParams.updated) === "1"
      ? "Meeting date updated and a fresh confirmation link has been sent."
      : undefined;
  const errorMessage =
    getSearchParamValue(resolvedSearchParams.error) === "invalid-invitation"
      ? "We could not save that new date. Please review it and try again."
      : undefined;

  const cookieStore = await cookies();
  const pb = await getAppwriteAdmin();
  const vpe = await getAuthenticatedVpe(pb, cookieStore.get(VPE_SESSION_COOKIE)?.value);

  if (!vpe) {
    redirect("/login?next=%2Fadmin%2Finvitations");
  }

  const allInvitations = await listInvitationStatusItems(pb, vpe.id);
  const filteredInvitations =
    activeFilter === "all"
      ? allInvitations
      : allInvitations.filter((item) => item.status === activeFilter);
  let summary = { pending: 0, confirmed: 0, declined: 0 };
  summary = summarizeInvitationStatuses(allInvitations);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-[1.35rem] border border-[#e6ddd1] bg-white p-4 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)]">
          <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">All</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">{allInvitations.length}</p>
        </article>
        <article className="rounded-[1.35rem] border border-[#e6ddd1] bg-white p-4 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)]">
          <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">Pending</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">{summary.pending}</p>
        </article>
        <article className="rounded-[1.35rem] border border-[#e6ddd1] bg-white p-4 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)]">
          <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">Confirmed</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">{summary.confirmed}</p>
        </article>
        <article className="rounded-[1.35rem] border border-[#e6ddd1] bg-white p-4 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)]">
          <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">Declined</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">{summary.declined}</p>
        </article>
      </section>

      <section className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;
          const href =
            filter.value === "all"
              ? "/admin/invitations"
              : `/admin/invitations?status=${encodeURIComponent(filter.value)}`;

          return (
            <a
              key={filter.value}
              href={href}
              className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium hover:-translate-y-0.5 ${
                isActive
                  ? "border-[var(--accent)]/22 bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "border-[#e6ddd1] bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"
              }`}
            >
              {filter.label}
            </a>
          );
        })}
      </section>

      <InvitationStatusList
        activeFilter={activeFilter}
        errorMessage={errorMessage}
        initialOpenInvitationId={selectedInvitationId}
        invitations={filteredInvitations}
        successMessage={successMessage}
      />
    </div>
  );
}
