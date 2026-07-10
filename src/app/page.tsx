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
} from "@/lib/vpe/service";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialMode = getMode(getSearchParamValue(resolvedSearchParams.mode));
  const nextPath = normalizeNextPath(getSearchParamValue(resolvedSearchParams.next));
  const errorType = getSearchParamValue(resolvedSearchParams.error);
  const signupWasSent = getSearchParamValue(resolvedSearchParams.sent) === "1";
  const loginErrorMessage =
    errorType === "invalid-access-code"
      ? "We could not match that access code. Please check the code in your email and try again."
      : undefined;
  const signupErrorMessage =
    signupWasSent
      ? undefined
      : errorType === "signup-failed"
      ? "We could not send the access code. Please confirm your details and try again."
      : errorType === "invalid-signup-otc"
        ? "That OTC is not valid for new VPE signup. Please confirm it and try again."
        : undefined;
  const signupSuccessMessage = signupWasSent
    ? "Your access code has been sent. Check your email, then switch back to login."
    : undefined;

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

      const cookieStore = await cookies();
      cookieStore.set(
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
      signupAction={signup}
      signupErrorMessage={signupErrorMessage}
      signupSuccessMessage={signupSuccessMessage}
    />
  );
}
