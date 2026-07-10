import { LandingPage } from "@/components/home/landing-page";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createVpeSessionValue, VPE_SESSION_COOKIE } from "@/lib/auth/vpe-session";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import { getEnv } from "@/lib/config";
import { createMailTransport } from "@/lib/email/transport";
import {
  authenticateVpeWithAccessCode,
  createOrRefreshVpeAccess,
  InvalidSignupOtcError,
  VpeAccessDeliveryError,
} from "@/lib/vpe/service";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const VPE_SIGNUP_FALLBACK_CODE_COOKIE = "tm_vpe_signup_code";

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getMode(value: string | undefined) {
  return value === "signup" ? "signup" : "login";
}

function normalizeNextPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/admin") || nextPath.startsWith("//")) {
    return "/admin";
  }

  return nextPath;
}

export default async function Home({ searchParams }: HomePageProps) {
  const cookieStore = await cookies();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialMode = getMode(getSearchParamValue(resolvedSearchParams.mode));
  const nextPath = normalizeNextPath(getSearchParamValue(resolvedSearchParams.next));
  const errorType = getSearchParamValue(resolvedSearchParams.error);
  const signupWasSent = getSearchParamValue(resolvedSearchParams.sent) === "1";
  const deliveryMode = getSearchParamValue(resolvedSearchParams.delivery);
  const manualAccessCode = cookieStore.get(VPE_SIGNUP_FALLBACK_CODE_COOKIE)?.value;
  const loginErrorMessage =
    errorType === "invalid-access-code"
      ? "We could not match that access code. Please check the code in your email and try again."
      : undefined;
  const signupErrorMessage =
    signupWasSent
      ? undefined
      : errorType === "signup-failed"
      ? "We could not send the access code. Please confirm your details and try again."
      : errorType === "signup-backend-failed"
        ? "We could not save your access request right now. Please try again in a moment."
        : errorType === "signup-config-failed"
          ? "The hosted email setup is not ready yet. Please try again shortly."
      : errorType === "invalid-signup-otc"
        ? "That OTC is not valid for new VPE signup. Please confirm it and try again."
        : undefined;
  const signupSuccessMessage = signupWasSent
    ? deliveryMode === "manual" && manualAccessCode
      ? `Email delivery is delayed right now. Use this access code now: ${manualAccessCode}`
      : "Your access code has been sent. Check your email, then switch back to login."
    : undefined;
  const persistSignupSuccess = deliveryMode === "manual" && Boolean(manualAccessCode);

  async function continueWithAccessCode(formData: FormData) {
    "use server";

    const accessCode =
      typeof formData.get("accessCode") === "string" ? String(formData.get("accessCode")) : "";
    const requestedNextPath =
      typeof formData.get("next") === "string" ? String(formData.get("next")) : "/admin";
    const safeNextPath = normalizeNextPath(requestedNextPath);

    try {
      const pb = await getAppwriteAdmin();
      const vpe = await authenticateVpeWithAccessCode(pb, accessCode);

      if (!vpe) {
        redirect(
          `/?mode=login&next=${encodeURIComponent(safeNextPath)}&error=invalid-access-code`,
        );
      }
      const nextCookieStore = await cookies();
      nextCookieStore.set(
        VPE_SESSION_COOKIE,
        createVpeSessionValue({
          vpeId: vpe.id,
          accessCodeHash: vpe.accessCodeHash,
        }),
        {
          httpOnly: true,
          maxAge: 60 * 60 * 8,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        },
      );
    } catch {
      redirect(`/?mode=login&next=${encodeURIComponent(safeNextPath)}&error=invalid-access-code`);
    }

    redirect(safeNextPath);
  }

  async function signup(formData: FormData) {
    "use server";

    try {
      const env = getEnv();
      const pb = await getAppwriteAdmin();
      const transporter = createMailTransport();

      await createOrRefreshVpeAccess(
        pb,
        transporter,
        { fromAddress: env.SMTP_FROM, signupOtc: env.VPE_SIGNUP_OTC },
        formData,
      );
    } catch (error) {
      console.error("VPE signup failed", error);

      if (error instanceof InvalidSignupOtcError) {
        redirect("/?mode=signup&error=invalid-signup-otc");
      }

      if (error instanceof VpeAccessDeliveryError) {
        const nextCookieStore = await cookies();

        nextCookieStore.set(VPE_SIGNUP_FALLBACK_CODE_COOKIE, error.accessCode, {
          httpOnly: true,
          maxAge: 60 * 5,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        redirect("/?mode=signup&sent=1&delivery=manual");
      }

      if (typeof error === "object" && error !== null && "status" in error) {
        redirect("/?mode=signup&error=signup-backend-failed");
      }

      if (typeof error === "object" && error !== null && "issues" in error) {
        redirect("/?mode=signup&error=signup-config-failed");
      }

      redirect("/?mode=signup&error=signup-failed");
    }

    redirect("/?mode=signup&sent=1");
  }

  return (
    <LandingPage
      initialMode={initialMode}
      loginAction={continueWithAccessCode}
      loginErrorMessage={loginErrorMessage}
      nextPath={nextPath}
      persistSignupSuccess={persistSignupSuccess}
      signupAction={signup}
      signupErrorMessage={signupErrorMessage}
      signupSuccessMessage={signupSuccessMessage}
    />
  );
}
