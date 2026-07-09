import { InvitationResponseCard } from "@/components/public/invitation-response-card";
import {
  getInvitationConfirmationDetails,
  respondToInvitation,
} from "@/lib/invitations/response";
import { redirect } from "@/lib/next/navigation";
import { getPocketBaseAdmin } from "@/lib/pocketbase/client";

type ConfirmationPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const feedbackMessage =
    getSearchParamValue(resolvedSearchParams.saved) === "1"
      ? getSearchParamValue(resolvedSearchParams.response) === "declined"
        ? "Thank you. Your response has been saved and the VPE can reschedule if needed."
        : "Thank you. Your availability has been saved."
      : undefined;
  let invitation = null;

  async function saveResponse(formData: FormData) {
    "use server";

    const token = typeof formData.get("token") === "string" ? String(formData.get("token")) : "";
    const response =
      formData.get("response") === "declined" ? "declined" : "accepted";

    try {
      const admin = await getPocketBaseAdmin();
      await respondToInvitation(admin, {
        token,
        response,
      });
    } catch {
      redirect(`/confirm/${token}`);
    }

    redirect(`/confirm/${token}?saved=1&response=${response}`);
  }

  try {
    const pb = await getPocketBaseAdmin();
    invitation = await getInvitationConfirmationDetails(pb, resolvedParams.token);
  } catch {
    invitation = null;
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
          action={saveResponse}
          feedbackMessage={feedbackMessage}
        />
      </div>
    </main>
  );
}
