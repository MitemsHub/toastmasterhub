"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { InvitationConfirmationDetails } from "@/lib/invitations/response";

type InvitationResponseState = {
  status: "idle" | "success" | "error";
  response?: Extract<InvitationConfirmationDetails["status"], "accepted" | "declined">;
  message?: string;
};

type InvitationResponseCardProps = {
  invitation: InvitationConfirmationDetails;
  token: string;
  initialState?: InvitationResponseState;
};

function getLockedResponseMessage(status: InvitationConfirmationDetails["status"]) {
  if (status === "accepted") {
    return "Thank you. Your availability is confirmed.";
  }

  if (status === "declined") {
    return "Thank you. The VPE can reschedule from their workspace.";
  }

  return "This meeting request has already been answered.";
}

export function InvitationResponseCard({
  invitation,
  token,
  initialState = { status: "idle" },
}: InvitationResponseCardProps) {
  const router = useRouter();
  const [actionState, setActionState] = useState(initialState);
  const [pendingResponse, setPendingResponse] = useState<
    Extract<InvitationConfirmationDetails["status"], "accepted" | "declined"> | null
  >(null);
  const effectiveStatus =
    actionState.status === "success" && actionState.response
      ? actionState.response
      : invitation.status;
  const canRespond = invitation.canRespond && actionState.status !== "success";
  const feedbackMessage = actionState.message;

  async function handleResponse(
    response: Extract<InvitationConfirmationDetails["status"], "accepted" | "declined">,
  ) {
    setPendingResponse(response);
    setActionState((current) => ({
      ...current,
      status: current.status === "success" ? current.status : "idle",
      message: undefined,
    }));

    try {
      const result = await fetch("/api/invitations/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          response,
        }),
      });
      const payload = (await result.json().catch(() => ({}))) as { message?: string };

      if (!result.ok) {
        throw new Error(payload.message || "This response could not be saved right now. Please try again.");
      }

      setActionState({
        status: "success",
        response,
        message:
          payload.message ??
          (response === "declined"
            ? "Sorry, we will reschedule."
            : "Thank you. Your availability has been saved."),
      });
      router.replace(`/confirm/${encodeURIComponent(token)}?saved=1&response=${response}`);
      router.refresh();
    } catch (error) {
      setActionState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "This response could not be saved right now. Please try again.",
      });
    } finally {
      setPendingResponse(null);
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-[1.8rem] border border-[#e6ddd1] bg-white p-6 text-zinc-950 shadow-[0_40px_120px_-70px_rgba(15,23,42,0.28)] sm:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {invitation.evaluatorPhotoUrl ? (
          <Image
            src={invitation.evaluatorPhotoUrl}
            alt={invitation.evaluatorName}
            width={112}
            height={112}
            className="h-24 w-24 rounded-[1.2rem] object-cover shadow-[0_18px_34px_-22px_rgba(15,23,42,0.22)] sm:h-28 sm:w-28"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-[1.2rem] bg-[#f5f0e8] text-2xl font-semibold text-zinc-500 shadow-[0_18px_34px_-22px_rgba(15,23,42,0.22)] sm:h-28 sm:w-28">
            {invitation.evaluatorName.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Evaluator confirmation
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-zinc-950 sm:text-[2.4rem]">
            {invitation.evaluatorName}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600">{invitation.evaluatorProfile}</p>
          <div className="mt-6 grid gap-3 rounded-[1.35rem] border border-[#ece4d8] bg-[#fcfaf7] p-5 text-sm text-zinc-600 sm:grid-cols-2">
            <p className="leading-7">
              <span className="text-zinc-500">Meeting</span>
              <br />
              <span className="font-medium text-zinc-950">{invitation.meetingTitle}</span>
            </p>
            <p className="leading-7">
              <span className="text-zinc-500">Date</span>
              <br />
              <span className="font-medium text-zinc-950">{invitation.meetingDate}</span>
            </p>
            {invitation.meetingNote ? (
              <p className="leading-7 sm:col-span-2">
                <span className="text-zinc-500">Note</span>
                <br />
                <span className="text-zinc-600">{invitation.meetingNote}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {feedbackMessage ? (
        <p
          className={`mt-6 rounded-[1.1rem] px-4 py-3 text-sm font-medium ${
            actionState.status === "error"
              ? "border border-rose-200 bg-rose-50 text-rose-800"
              : "border border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {feedbackMessage}
        </p>
      ) : null}

      {canRespond ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void handleResponse("accepted")}
            disabled={pendingResponse !== null}
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-zinc-800"
          >
            <span className="inline-flex items-center gap-2">
              {pendingResponse === "accepted" ? (
                <motion.span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-full border-2 border-current/25 border-t-current"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : null}
              <span>{pendingResponse === "accepted" ? "Saving..." : "Yes, I will"}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void handleResponse("declined")}
            disabled={pendingResponse !== null}
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#e6ddd1] bg-[#faf7f2] px-5 text-sm font-semibold text-zinc-700 hover:-translate-y-0.5 hover:border-zinc-300 hover:text-zinc-950"
          >
            <span className="inline-flex items-center gap-2">
              {pendingResponse === "declined" ? (
                <motion.span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-full border-2 border-current/25 border-t-current"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : null}
              <span>{pendingResponse === "declined" ? "Saving..." : "No, I won't"}</span>
            </span>
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          <p className="rounded-[1.1rem] border border-[#e6ddd1] bg-[#fcfaf7] px-4 py-3 text-sm text-zinc-600">
            This meeting request has already been answered.
          </p>
          <p className="text-sm font-medium text-zinc-800">
            {getLockedResponseMessage(effectiveStatus)}
          </p>
        </div>
      )}
    </section>
  );
}
