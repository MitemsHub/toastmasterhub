import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import { VPE_SESSION_COOKIE } from "@/lib/auth/vpe-session";
import { createMailTransport } from "@/lib/email/transport";
import { rescheduleInvitation } from "@/lib/invitations/workflow";
import { getEnv } from "@/lib/config";
import { getAppBaseUrl } from "@/lib/runtime/app-url";
import { getAuthenticatedVpe } from "@/lib/vpe/service";

type ReschedulePayload = {
  invitationId?: string;
  meetingTitle?: string;
  meetingDate?: string;
  meetingNote?: string;
};

export async function POST(request: Request) {
  let payload: ReschedulePayload;

  try {
    payload = (await request.json()) as ReschedulePayload;
  } catch {
    return NextResponse.json(
      { message: "We could not read that new date. Please try again." },
      { status: 400 },
    );
  }

  const invitationId = typeof payload.invitationId === "string" ? payload.invitationId : "";
  const meetingTitle = typeof payload.meetingTitle === "string" ? payload.meetingTitle : "";
  const meetingDate = typeof payload.meetingDate === "string" ? payload.meetingDate : "";
  const meetingNote = typeof payload.meetingNote === "string" ? payload.meetingNote : "";

  if (!invitationId || !meetingTitle || !meetingDate) {
    return NextResponse.json(
      { message: "We could not save that new date. Please review it and try again." },
      { status: 400 },
    );
  }

  try {
    // #region debug-point E:reschedule-route-start
    await fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "confirm-reschedule-load",
        runId: "post-fix",
        hypothesisId: "E",
        location: "src/app/api/admin/invitations/reschedule/route.ts:POST:start",
        msg: "[DEBUG] Invitation reschedule API request started",
        data: {
          invitationId,
          meetingDate,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const currentEnv = getEnv();
    const admin = await getAppwriteAdmin();
    const cookieStore = await cookies();
    const currentVpe = await getAuthenticatedVpe(
      admin,
      cookieStore.get(VPE_SESSION_COOKIE)?.value,
    );

    if (!currentVpe) {
      return NextResponse.json({ message: "Please log in again." }, { status: 401 });
    }

    const formData = new FormData();
    formData.set("invitationId", invitationId);
    formData.set("meetingTitle", meetingTitle);
    formData.set("meetingDate", meetingDate);
    formData.set("meetingNote", meetingNote);

    await rescheduleInvitation(
      admin,
      createMailTransport(),
      {
        fromAddress: currentEnv.SMTP_FROM,
        appBaseUrl: await getAppBaseUrl(),
      },
      {
        vpeId: currentVpe.id,
        vpeName: currentVpe.name,
      },
      formData,
    );

    // #region debug-point E:reschedule-route-success
    await fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "confirm-reschedule-load",
        runId: "post-fix",
        hypothesisId: "E",
        location: "src/app/api/admin/invitations/reschedule/route.ts:POST:success",
        msg: "[DEBUG] Invitation reschedule API request completed",
        data: {
          invitationId,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({
      message: "Meeting date updated and a fresh confirmation link has been sent.",
    });
  } catch (error) {
    // #region debug-point E:reschedule-route-failed
    await fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "confirm-reschedule-load",
        runId: "post-fix",
        hypothesisId: "E",
        location: "src/app/api/admin/invitations/reschedule/route.ts:POST:failed",
        msg: "[DEBUG] Invitation reschedule API request failed",
        data: {
          invitationId,
          error: error instanceof Error ? error.message : "unknown-error",
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json(
      { message: "We could not save that new date. Please review it and try again." },
      { status: 500 },
    );
  }
}
