import { NextResponse } from "next/server";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import { respondToInvitation } from "@/lib/invitations/response";

type ResponsePayload = {
  token?: string;
  response?: "accepted" | "declined";
};

export async function POST(request: Request) {
  let payload: ResponsePayload;

  try {
    payload = (await request.json()) as ResponsePayload;
  } catch {
    return NextResponse.json(
      { message: "This response could not be read. Please try again." },
      { status: 400 },
    );
  }

  const token = typeof payload.token === "string" ? payload.token : "";
  const response = payload.response === "declined" ? "declined" : payload.response === "accepted" ? "accepted" : undefined;

  if (!token || !response) {
    return NextResponse.json(
      { message: "This response is incomplete. Please try again." },
      { status: 400 },
    );
  }

  try {
    // #region debug-point E:respond-route-start
    await fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "confirm-reschedule-load",
        runId: "post-fix",
        hypothesisId: "E",
        location: "src/app/api/invitations/respond/route.ts:POST:start",
        msg: "[DEBUG] Invitation respond API request started",
        data: {
          response,
          tokenLength: token.length,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const admin = await getAppwriteAdmin();
    await respondToInvitation(admin, {
      token,
      response,
    });

    // #region debug-point E:respond-route-success
    await fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "confirm-reschedule-load",
        runId: "post-fix",
        hypothesisId: "E",
        location: "src/app/api/invitations/respond/route.ts:POST:success",
        msg: "[DEBUG] Invitation respond API request completed",
        data: {
          response,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({
      message:
        response === "declined"
          ? "Sorry, we will reschedule."
          : "Thank you. Your availability has been saved.",
    });
  } catch (error) {
    // #region debug-point E:respond-route-failed
    await fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "confirm-reschedule-load",
        runId: "post-fix",
        hypothesisId: "E",
        location: "src/app/api/invitations/respond/route.ts:POST:failed",
        msg: "[DEBUG] Invitation respond API request failed",
        data: {
          error: error instanceof Error ? error.message : "unknown-error",
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json(
      { message: "This response could not be saved right now. Please try again." },
      { status: 500 },
    );
  }
}
