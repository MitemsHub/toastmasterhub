import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import { VPE_SESSION_COOKIE } from "@/lib/auth/vpe-session";
import { cancelInvitation } from "@/lib/invitations/workflow";
import { getAuthenticatedVpe } from "@/lib/vpe/service";

type CancelPayload = {
  invitationId?: string;
};

export async function POST(request: Request) {
  let payload: CancelPayload;

  try {
    payload = (await request.json()) as CancelPayload;
  } catch {
    return NextResponse.json(
      { message: "We could not cancel that confirmation right now." },
      { status: 400 },
    );
  }

  const invitationId = typeof payload.invitationId === "string" ? payload.invitationId : "";

  if (!invitationId) {
    return NextResponse.json(
      { message: "We could not cancel that confirmation right now." },
      { status: 400 },
    );
  }

  try {
    const admin = await getAppwriteAdmin();
    const cookieStore = await cookies();
    const currentVpe = await getAuthenticatedVpe(
      admin,
      cookieStore.get(VPE_SESSION_COOKIE)?.value,
    );

    if (!currentVpe) {
      return NextResponse.json({ message: "Please log in again." }, { status: 401 });
    }

    await cancelInvitation(
      admin,
      {
        vpeId: currentVpe.id,
        vpeName: currentVpe.name,
      },
      invitationId,
    );

    return NextResponse.json({
      message: "Confirmation cancelled.",
    });
  } catch {
    return NextResponse.json(
      { message: "We could not cancel that confirmation right now." },
      { status: 500 },
    );
  }
}
