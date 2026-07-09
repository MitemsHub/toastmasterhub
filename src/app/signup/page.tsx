import { redirect } from "next/navigation";

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const resolvedSearchParams = await searchParams;
  const errorMessage = getSearchParamValue(resolvedSearchParams.error);
  const sent = getSearchParamValue(resolvedSearchParams.sent);
  const params = new URLSearchParams({
    mode: "signup",
  });

  if (errorMessage === "signup-failed") {
    params.set("error", "signup-failed");
  }

  if (sent === "1") {
    params.set("sent", "1");
  }

  redirect(`/?${params.toString()}`);
}
