import { cookies } from "next/headers";
import { ConfirmationRequestForm } from "@/components/admin/evaluators/confirmation-request-form";
import { EvaluatorDirectory } from "@/components/admin/evaluators/evaluator-directory";
import { EvaluatorForm } from "@/components/admin/evaluators/evaluator-form";
import { EvaluatorImportForm } from "@/components/admin/evaluators/evaluator-import-form";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import {
  createEvaluatorProfile,
  deleteEvaluatorProfile,
  DuplicateEvaluatorError,
  listEvaluatorDirectoryItems,
  updateEvaluatorProfile,
} from "@/lib/evaluators/service";
import { importEvaluatorsFromCsv, EvaluatorImportError } from "@/lib/evaluators/import";
import {
  createConfirmationRequest,
  EvaluatorDateConflictError,
} from "@/lib/invitations/workflow";
import { getEnv } from "@/lib/config";
import { createMailTransport } from "@/lib/email/transport";
import { redirect } from "@/lib/next/navigation";
import { getAppBaseUrl } from "@/lib/runtime/app-url";
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
  const requestSuccessMessage =
    getSearchParamValue(resolvedSearchParams.sent) === "1"
      ? "Confirmation sent. The evaluator can respond from the email link."
      : undefined;
  const directorySuccessMessage =
    getSearchParamValue(resolvedSearchParams.added) === "1"
      ? "Evaluator added to the shared directory."
      : getSearchParamValue(resolvedSearchParams.updated) === "1"
        ? "Evaluator details saved."
        : getSearchParamValue(resolvedSearchParams.deleted) === "1"
          ? "Evaluator deleted."
      : undefined;
  const importedCount = Number(getSearchParamValue(resolvedSearchParams.imported) ?? "0");
  const skippedDuplicateCount = Number(getSearchParamValue(resolvedSearchParams.skipped) ?? "0");
  const importSuccessMessage =
    importedCount > 0 || skippedDuplicateCount > 0
      ? `Imported ${importedCount} evaluator${importedCount === 1 ? "" : "s"} and skipped ${skippedDuplicateCount} duplicate ${skippedDuplicateCount === 1 ? "profile" : "profiles"}.`
      : undefined;
  const errorType = getSearchParamValue(resolvedSearchParams.error);
  const requestErrorMessage =
    errorType === "invalid-evaluator"
      ? "Select an evaluator, then complete the meeting title and meeting date."
      : errorType === "evaluator-date-taken"
        ? "That evaluator is already assigned for that meeting date. Choose another date or evaluator."
        : undefined;
  const directoryErrorMessage =
    errorType === "duplicate-evaluator"
      ? "That evaluator already exists in the shared directory."
      : errorType === "invalid-directory-evaluator"
        ? "Complete the evaluator details and add a portrait before saving."
        : undefined;
  const importErrorMessage =
    errorType === "invalid-import"
      ? "Upload the CSV template with fullName, email, phone, and profile."
      : undefined;

  async function saveConfirmationRequest(formData: FormData) {
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
      const transporter = createMailTransport();

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
      if (error instanceof EvaluatorDateConflictError) {
        redirect("/admin/evaluators?error=evaluator-date-taken");
      }

      console.error("Failed to create evaluator confirmation request.", error);
      redirect("/admin/evaluators?error=invalid-evaluator");
    }

    redirect("/admin/evaluators?sent=1");
  }

  async function saveSharedEvaluator(formData: FormData) {
    "use server";

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
      await createEvaluatorProfile(admin, formData, currentVpe.id);
    } catch (error) {
      if (error instanceof DuplicateEvaluatorError) {
        redirect("/admin/evaluators?error=duplicate-evaluator");
      }

      console.error("Failed to add shared evaluator.", error);
      redirect("/admin/evaluators?error=invalid-directory-evaluator");
    }

    redirect("/admin/evaluators?added=1");
  }

  async function uploadSharedEvaluators(formData: FormData) {
    "use server";

    const admin = await getAppwriteAdmin();
    const nextCookieStore = await cookies();
    const currentVpe = await getAuthenticatedVpe(
      admin,
      nextCookieStore.get(VPE_SESSION_COOKIE)?.value,
    );

    if (!currentVpe) {
      redirect("/login?next=%2Fadmin%2Fevaluators");
    }

    const csvFile = formData.get("csvFile");

    if (!(csvFile instanceof File) || !csvFile.name) {
      redirect("/admin/evaluators?error=invalid-import");
    }

    let summary: Awaited<ReturnType<typeof importEvaluatorsFromCsv>>;

    try {
      summary = await importEvaluatorsFromCsv(admin, csvFile, currentVpe.id);
    } catch (error) {
      if (error instanceof EvaluatorImportError) {
        console.error("Evaluator import failed.", error);
        redirect("/admin/evaluators?error=invalid-import");
      }

      console.error("Failed to import shared evaluators.", error);
      redirect("/admin/evaluators?error=invalid-import");
    }

    redirect(
      `/admin/evaluators?imported=${encodeURIComponent(String(summary.createdCount))}&skipped=${encodeURIComponent(String(summary.skippedDuplicateCount))}`,
    );
  }

  async function updateSharedEvaluator(formData: FormData) {
    "use server";

    const admin = await getAppwriteAdmin();
    const nextCookieStore = await cookies();
    const currentVpe = await getAuthenticatedVpe(
      admin,
      nextCookieStore.get(VPE_SESSION_COOKIE)?.value,
    );

    if (!currentVpe) {
      redirect("/login?next=%2Fadmin%2Fevaluators");
    }

    const evaluatorId = formData.get("evaluatorId");

    if (typeof evaluatorId !== "string" || !evaluatorId.trim()) {
      redirect("/admin/evaluators?error=invalid-directory-evaluator");
    }

    try {
      await updateEvaluatorProfile(admin, evaluatorId, formData);
    } catch (error) {
      if (error instanceof DuplicateEvaluatorError) {
        redirect("/admin/evaluators?error=duplicate-evaluator");
      }

      console.error("Failed to update shared evaluator.", error);
      redirect("/admin/evaluators?error=invalid-directory-evaluator");
    }

    redirect("/admin/evaluators?updated=1");
  }

  async function removeSharedEvaluator(formData: FormData) {
    "use server";

    const admin = await getAppwriteAdmin();
    const nextCookieStore = await cookies();
    const currentVpe = await getAuthenticatedVpe(
      admin,
      nextCookieStore.get(VPE_SESSION_COOKIE)?.value,
    );

    if (!currentVpe) {
      redirect("/login?next=%2Fadmin%2Fevaluators");
    }

    const evaluatorId = formData.get("evaluatorId");

    if (typeof evaluatorId !== "string" || !evaluatorId.trim()) {
      redirect("/admin/evaluators?error=invalid-directory-evaluator");
    }

    try {
      await deleteEvaluatorProfile(admin, evaluatorId);
    } catch (error) {
      console.error("Failed to delete shared evaluator.", error);
      redirect("/admin/evaluators?error=invalid-directory-evaluator");
    }

    redirect("/admin/evaluators?deleted=1");
  }

  const cookieStore = await cookies();
  const pb = await getAppwriteAdmin();
  const vpe = await getAuthenticatedVpe(pb, cookieStore.get(VPE_SESSION_COOKIE)?.value);

  if (!vpe) {
    redirect("/login?next=%2Fadmin%2Fevaluators");
  }

  const evaluators = await listEvaluatorDirectoryItems(pb);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="grid gap-6">
        <ConfirmationRequestForm
          action={saveConfirmationRequest}
          errorMessage={requestErrorMessage}
          evaluators={evaluators}
          successMessage={requestSuccessMessage}
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_0.88fr]">
          <EvaluatorForm
            action={saveSharedEvaluator}
            errorMessage={directoryErrorMessage}
            successMessage={directorySuccessMessage}
          />
          <EvaluatorImportForm
            action={uploadSharedEvaluators}
            errorMessage={importErrorMessage}
            successMessage={importSuccessMessage}
          />
        </div>
      </div>
      <EvaluatorDirectory
        deleteAction={removeSharedEvaluator}
        evaluators={evaluators}
        updateAction={updateSharedEvaluator}
      />
    </div>
  );
}
