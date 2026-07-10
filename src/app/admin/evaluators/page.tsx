import nodemailer from "nodemailer";
import { cookies } from "next/headers";
import { EvaluatorDirectory } from "@/components/admin/evaluators/evaluator-directory";
import { EvaluatorForm } from "@/components/admin/evaluators/evaluator-form";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import { listEvaluatorDirectoryItems } from "@/lib/evaluators/service";
import { createConfirmationRequest } from "@/lib/invitations/workflow";
import { getEnv } from "@/lib/config";
import { redirect } from "@/lib/next/navigation";
import { getAppBaseUrl, getSmtpHost } from "@/lib/runtime/app-url";
import { VPE_SESSION_COOKIE } from "@/lib/auth/vpe-session";
import { getAuthenticatedVpe } from "@/lib/vpe/service";

type EvaluatorsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EvaluatorsPage({ searchParams }: EvaluatorsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const successMessage =
    getSearchParamValue(resolvedSearchParams.sent) === "1"
      ? "Confirmation sent. The evaluator can respond from the email link."
      : undefined;
  const errorMessage =
    getSearchParamValue(resolvedSearchParams.error) === "invalid-evaluator"
      ? "Please complete the evaluator details, portrait, meeting title, and meeting date."
      : undefined;

  async function saveEvaluator(formData: FormData) {
    "use server";

    const currentEnv = getEnv();
    const admin = await getAppwriteAdmin();
    const nextCookieStore = await cookies();
    const currentVpe = await getAuthenticatedVpe(
      admin,
      nextCookieStore.get(VPE_SESSION_COOKIE)?.value,
    );

    if (!currentVpe) {
      redirect("/login?next=%2Fadmin%2Fevaluators");
    }

    try {
      const transporter = nodemailer.createTransport({
        host: getSmtpHost(),
        port: currentEnv.SMTP_PORT,
        secure: currentEnv.SMTP_PORT === 465,
        auth: {
          user: currentEnv.SMTP_USER,
          pass: currentEnv.SMTP_PASS,
        },
      });

      await createConfirmationRequest(
        admin,
        transporter,
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
    } catch (error) {
      console.error("Failed to create evaluator confirmation request.", error);
      redirect("/admin/evaluators?error=invalid-evaluator");
    }

    redirect("/admin/evaluators?sent=1");
  }

  const cookieStore = await cookies();
  const pb = await getAppwriteAdmin();
  const vpe = await getAuthenticatedVpe(pb, cookieStore.get(VPE_SESSION_COOKIE)?.value);

  if (!vpe) {
    redirect("/login?next=%2Fadmin%2Fevaluators");
  }

  const evaluators = await listEvaluatorDirectoryItems(pb, vpe.id);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <EvaluatorForm
        action={saveEvaluator}
        errorMessage={errorMessage}
        successMessage={successMessage}
      />
      <EvaluatorDirectory evaluators={evaluators} />
    </div>
  );
}
