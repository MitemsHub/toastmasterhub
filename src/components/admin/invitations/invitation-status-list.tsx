"use client";

import { type FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Reveal } from "@/components/motion/reveal";
import { useRouter } from "@/lib/next/navigation";

type InvitationListItem = {
  id: string;
  evaluatorName: string;
  evaluatorEmail: string;
  evaluatorProfile: string;
  evaluatorPhotoUrl: string;
  meetingTitle: string;
  meetingDate: string;
  meetingNote: string;
  status: "pending" | "accepted" | "declined";
  sentAt?: string;
  respondedAt?: string;
};

const statusStyles: Record<InvitationListItem["status"], string> = {
  pending: "border border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  declined: "border border-rose-200 bg-rose-50 text-rose-700",
};

function formatStampLabel(label: string, value: string | undefined) {
  if (!value) {
    return null;
  }

  return `${label} ${value.slice(0, 10)}`;
}

export function InvitationStatusList({
  invitations,
  activeFilter,
  initialOpenInvitationId,
  errorMessage,
  successMessage,
}: {
  invitations: InvitationListItem[];
  activeFilter: "all" | "pending" | "accepted" | "declined";
  initialOpenInvitationId?: string;
  errorMessage?: string;
  successMessage?: string;
}) {
  const router = useRouter();
  const [openInvitationId, setOpenInvitationId] = useState(initialOpenInvitationId ?? "");
  const [localErrorMessage, setLocalErrorMessage] = useState(errorMessage);
  const [localSuccessMessage, setLocalSuccessMessage] = useState(successMessage);
  const [pendingAction, setPendingAction] = useState<{
    invitationId: string;
    kind: "reschedule" | "cancel";
  } | null>(null);
  const selectedInvitation = useMemo(
    () => invitations.find((invitation) => invitation.id === openInvitationId),
    [invitations, openInvitationId],
  );

  async function handleCancel(invitationId: string) {
    setPendingAction({ invitationId, kind: "cancel" });
    setLocalErrorMessage(undefined);
    setLocalSuccessMessage(undefined);

    try {
      const result = await fetch("/api/admin/invitations/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invitationId }),
      });
      const payload = (await result.json().catch(() => ({}))) as { message?: string };

      if (!result.ok) {
        throw new Error(payload.message || "We could not cancel that confirmation right now.");
      }

      setLocalSuccessMessage(payload.message || "Confirmation cancelled.");
      router.replace(
        activeFilter === "all"
          ? "/admin/invitations"
          : `/admin/invitations?status=${encodeURIComponent(activeFilter)}`,
      );
      router.refresh();
    } catch (error) {
      setLocalErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not cancel that confirmation right now.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRescheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedInvitation) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const invitationId =
      typeof formData.get("invitationId") === "string" ? String(formData.get("invitationId")) : "";
    const meetingTitle =
      typeof formData.get("meetingTitle") === "string" ? String(formData.get("meetingTitle")) : "";
    const meetingDate =
      typeof formData.get("meetingDate") === "string" ? String(formData.get("meetingDate")) : "";
    const meetingNote =
      typeof formData.get("meetingNote") === "string" ? String(formData.get("meetingNote")) : "";

    setPendingAction({ invitationId, kind: "reschedule" });
    setLocalErrorMessage(undefined);
    setLocalSuccessMessage(undefined);

    try {
      const result = await fetch("/api/admin/invitations/reschedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitationId,
          meetingTitle,
          meetingDate,
          meetingNote,
        }),
      });
      const payload = (await result.json().catch(() => ({}))) as { message?: string };

      if (!result.ok) {
        throw new Error(payload.message || "We could not save that new date. Please review it and try again.");
      }

      setLocalSuccessMessage(
        payload.message || "Meeting date updated and a fresh confirmation link has been sent.",
      );
      setOpenInvitationId("");
      router.replace(
        activeFilter === "all"
          ? "/admin/invitations?updated=1"
          : `/admin/invitations?updated=1&status=${encodeURIComponent(activeFilter)}`,
      );
      router.refresh();
    } catch (error) {
      setLocalErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not save that new date. Please review it and try again.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  if (invitations.length === 0) {
    return (
      <Reveal>
        <section className="rounded-[1.5rem] border border-dashed border-[#d8cebf] bg-white p-6 text-center text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)] sm:p-6">
          <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent)] uppercase">
            Confirmation board
          </p>
          <h2 className="mt-2 text-balance text-2xl font-semibold tracking-[-0.05em] text-zinc-950">
            No confirmations match this view yet
          </h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Send a new request or switch the filter.
          </p>
        </section>
      </Reveal>
    );
  }

  return (
    <>
      <Reveal>
        <section className="rounded-[1.5rem] border border-[#e6ddd1] bg-white p-5 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)] sm:p-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent)] uppercase">
                Confirmation board
              </p>
              <h2 className="mt-2 text-balance text-2xl font-semibold tracking-[-0.05em] text-zinc-950">
                Review and manage responses
              </h2>
            </div>
            <div className="rounded-full border border-[#e6ddd1] bg-[#faf7f2] px-3 py-1.5 text-[10px] font-medium tracking-[0.22em] text-zinc-500 uppercase">
              {activeFilter === "accepted" ? "Confirmed" : activeFilter}
            </div>
          </div>

          {localErrorMessage ? (
            <p className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {localErrorMessage}
            </p>
          ) : null}

          {localSuccessMessage ? (
            <p className="mt-4 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {localSuccessMessage}
            </p>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-[#ece4d8] bg-[#fcfaf7]">
            <div className="hidden grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_minmax(0,0.7fr)_auto] gap-4 border-b border-[#ece4d8] px-4 py-3 text-[11px] font-medium tracking-[0.22em] text-zinc-500 uppercase lg:grid">
              <span>Evaluator</span>
              <span>Meeting</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {invitations.map((invitation) => (
              <article
                key={invitation.id}
                className="grid gap-4 border-t border-[#ece4d8] px-4 py-4 first:border-t-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_minmax(0,0.7fr)_auto] lg:items-center"
              >
                <div className="flex min-w-0 gap-3">
                  {invitation.evaluatorPhotoUrl ? (
                    <Image
                      src={invitation.evaluatorPhotoUrl}
                      alt={invitation.evaluatorName}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-[0.9rem] object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-[0.9rem] bg-[#f5f0e8] text-sm font-semibold text-zinc-500">
                      {invitation.evaluatorName.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold tracking-[-0.03em] text-zinc-950">
                      {invitation.evaluatorName}
                    </h3>
                    <p className="truncate text-sm text-[var(--accent)]">{invitation.evaluatorEmail}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600">
                      {invitation.evaluatorProfile}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-zinc-600">
                  <p className="font-medium text-zinc-950">{invitation.meetingTitle}</p>
                  <p>{invitation.meetingDate}</p>
                  {invitation.meetingNote ? (
                    <p className="line-clamp-2 text-zinc-500">{invitation.meetingNote}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium capitalize ${statusStyles[invitation.status]}`}
                  >
                    {invitation.status === "accepted" ? "confirmed" : invitation.status}
                  </span>
                  <div className="text-sm text-zinc-500">
                    <p>{formatStampLabel("Sent", invitation.sentAt) ?? "Sent date unavailable"}</p>
                    <p>{formatStampLabel("Responded", invitation.respondedAt) ?? "Awaiting reply"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpenInvitationId(invitation.id)}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[#e6ddd1] bg-white px-4 text-sm font-medium text-zinc-700 hover:-translate-y-0.5 hover:border-zinc-300 hover:text-zinc-950"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    disabled={pendingAction !== null}
                    onClick={() => void handleCancel(invitation.id)}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[#e6ddd1] bg-[#fcfaf7] px-4 text-sm font-medium text-zinc-500 hover:-translate-y-0.5 hover:border-rose-200 hover:text-rose-700"
                  >
                    <span className="inline-flex items-center gap-2">
                      {pendingAction?.kind === "cancel" && pendingAction.invitationId === invitation.id ? (
                        <motion.span
                          aria-hidden="true"
                          className="h-4 w-4 rounded-full border-2 border-current/25 border-t-current"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        />
                      ) : null}
                      <span>
                        {pendingAction?.kind === "cancel" && pendingAction.invitationId === invitation.id
                          ? "Cancelling..."
                          : "Cancel"}
                      </span>
                    </span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      {selectedInvitation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1712]/30 px-4 py-8">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onClick={() => setOpenInvitationId("")}
          />
          <div className="relative z-10 w-full max-w-md rounded-[1.5rem] border border-[#e6ddd1] bg-white p-5 shadow-[0_40px_120px_-70px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent)] uppercase">
                  Reschedule
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-zinc-950">
                  Update the meeting date
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {selectedInvitation.evaluatorName} will receive a fresh confirmation link for the new date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenInvitationId("")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e6ddd1] bg-[#faf7f2] text-zinc-500 hover:text-zinc-950"
                aria-label="Close reschedule modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="mt-5 space-y-4">
              <input type="hidden" name="invitationId" value={selectedInvitation.id} />
              <input type="hidden" name="meetingTitle" value={selectedInvitation.meetingTitle} />
              <input type="hidden" name="meetingNote" value={selectedInvitation.meetingNote} />

              <div className="rounded-[1rem] border border-[#ece4d8] bg-[#fcfaf7] px-4 py-3 text-sm text-zinc-600">
                <p className="font-medium text-zinc-950">{selectedInvitation.meetingTitle}</p>
                <p className="mt-1">{selectedInvitation.meetingDate}</p>
              </div>

              <label className="grid gap-2 text-sm font-medium text-zinc-800">
                <span>Meeting date</span>
                <input
                  name="meetingDate"
                  type="date"
                  defaultValue={selectedInvitation.meetingDate}
                  className="h-11 rounded-[0.95rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 outline-none focus:border-[var(--accent)]"
                />
              </label>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenInvitationId("")}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#e6ddd1] bg-white px-4 text-sm font-medium text-zinc-600 hover:text-zinc-950"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={pendingAction !== null}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-zinc-800"
                >
                  <span className="inline-flex items-center gap-2">
                    {pendingAction?.kind === "reschedule" &&
                    pendingAction.invitationId === selectedInvitation.id ? (
                      <motion.span
                        aria-hidden="true"
                        className="h-4 w-4 rounded-full border-2 border-current/25 border-t-current"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      />
                    ) : null}
                    <span>
                      {pendingAction?.kind === "reschedule" &&
                      pendingAction.invitationId === selectedInvitation.id
                        ? "Saving..."
                        : "Save new date"}
                    </span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
