import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeNextPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/admin") || nextPath.startsWith("//")) {
    return "/admin";
  }

  return nextPath;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextPath = normalizeNextPath(getSearchParamValue(resolvedSearchParams.next));
  const errorMessage = getSearchParamValue(resolvedSearchParams.error);
  const params = new URLSearchParams({
    mode: "login",
    next: nextPath,
  });

  if (errorMessage === "invalid-access-code") {
    params.set("error", "invalid-access-code");
  }

  redirect(`/?${params.toString()}`);
}
