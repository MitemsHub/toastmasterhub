import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminOfflineState } from "@/components/admin/admin-offline-state";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAppwriteAdmin } from "@/lib/appwrite/client";
import { getEnv } from "@/lib/config";
import { VPE_SESSION_COOKIE } from "@/lib/auth/vpe-session";
import { getAuthenticatedVpe } from "@/lib/vpe/service";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(VPE_SESSION_COOKIE)?.value;

  if (!sessionValue) {
    redirect("/login?next=%2Fadmin");
  }

  let vpe: Awaited<ReturnType<typeof getAuthenticatedVpe>> = null;
  let isOffline = false;

  try {
    const pb = await getAppwriteAdmin();
    vpe = await getAuthenticatedVpe(pb, sessionValue);
  } catch (error) {
    console.error("Failed to load admin layout session.", error);
    isOffline = true;
  }

  if (!isOffline && !vpe) {
    redirect("/login?next=%2Fadmin");
  }

  async function signOut() {
    "use server";

    const signOutCookies = await cookies();
    signOutCookies.delete(VPE_SESSION_COOKIE);
    redirect("/");
  }

  if (isOffline) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#faf7f2_0%,#f3eee7_100%)] px-6 py-10 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <AdminOfflineState
            title="Finish Appwrite setup before opening the VPE workspace"
            description="Toast Masters Hub could not reach Appwrite while checking your session. Confirm the project, database, collections, bucket, and server key before returning to the dashboard."
            baseUrl={getEnv().APPWRITE_ENDPOINT}
          />
        </div>
      </main>
    );
  }

  if (!vpe) {
    return null;
  }

  return (
    <AdminShell signOutAction={signOut} vpeEmail={vpe.email} vpeName={vpe.name}>
      {children}
    </AdminShell>
  );
}
