import { InvitationResponseCard } from "@/components/public/invitation-response-card";
import { getInvitationConfirmationDetails } from "@/lib/invitations/response";
import { getAppwriteAdmin } from "@/lib/appwrite/client";

type ConfirmationPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SavedResponse = "accepted" | "declined";

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSavedResponse(value: string | undefined): SavedResponse | undefined {
  if (value === "accepted" || value === "declined") {
    return value;
  }

  return undefined;
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const savedResponse =
    getSearchParamValue(resolvedSearchParams.saved) === "1"
      ? getSavedResponse(getSearchParamValue(resolvedSearchParams.response))
      : undefined;
  let invitation = null;

  try {
    const pb = await getAppwriteAdmin();
    invitation = await getInvitationConfirmationDetails(pb, resolvedParams.token);
  } catch {
    invitation = null;
  }

  if (!invitation && savedResponse) {
    return (
      <main className="min-h-screen bg-transparent px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[100dvh] max-w-4xl items-center justify-center">
          <section className="rounded-[1.8rem] border border-[var(--panel-border)] bg-[var(--panel)] p-8 text-center shadow-[var(--shadow-panel)] backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              Evaluator confirmation
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-zinc-950">
              {savedResponse === "declined" ? "Sorry, we will reschedule." : "Thank you."}
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              {savedResponse === "declined"
                ? "Your response has been saved and the VPE can send a new date if needed."
                : "Your availability has been saved successfully."}
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!invitation) {
    return (
      <main className="min-h-screen bg-transparent px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[100dvh] max-w-4xl items-center justify-center">
          <section className="rounded-[1.8rem] border border-[var(--panel-border)] bg-[var(--panel)] p-8 text-center shadow-[var(--shadow-panel)] backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              Evaluator confirmation
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-zinc-950">
              Invitation not found
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              This confirmation link is invalid or no longer available.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[100dvh] max-w-5xl items-center">
        <InvitationResponseCard
          invitation={invitation}
          token={resolvedParams.token}
          initialState={{
            status: savedResponse ? "success" : "idle",
            response: savedResponse,
            message:
              savedResponse === "declined"
                ? "Sorry, we will reschedule."
                : savedResponse === "accepted"
                  ? "Thank you. Your availability has been saved."
                  : undefined,
          }}
        />
      </div>
    </main>
  );
}
