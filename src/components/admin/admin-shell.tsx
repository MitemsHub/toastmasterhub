"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/evaluators", label: "Create evaluator" },
  { href: "/admin/invitations", label: "View confirmations" },
];

type AdminShellProps = {
  children: ReactNode;
  vpeName: string;
  vpeEmail: string;
  signOutAction: () => Promise<void>;
};

export function AdminShell({
  children,
  vpeName,
  vpeEmail,
  signOutAction,
}: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#faf7f2_0%,#f3eee7_100%)] text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1360px] flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <Reveal>
          <header className="rounded-[1.5rem] border border-[#e6ddd1] bg-white px-4 py-4 shadow-[0_30px_90px_-70px_rgba(15,23,42,0.28)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--accent)] uppercase">
                    Toast Masters Hub
                  </p>
                  <div className="rounded-full border border-[#e6ddd1] bg-[#faf7f2] px-3 py-1 text-[10px] tracking-[0.18em] text-zinc-500 uppercase">VPE workspace</div>
                </div>
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <h1 className="text-balance text-[1.1rem] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-[1.25rem]">
                    Manage evaluator confirmations
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-full border border-[#e6ddd1] bg-[#faf7f2] px-3 py-2 text-sm text-zinc-600">
                      <span className="font-medium text-zinc-950">{vpeName}</span>
                      <span className="mx-2 text-zinc-300">/</span>
                      <span className="hidden sm:inline">{vpeEmail}</span>
                      <span className="sm:hidden">Workspace</span>
                    </div>
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center rounded-full border border-[#e6ddd1] bg-white px-4 text-sm font-medium text-zinc-600 hover:-translate-y-0.5 hover:border-zinc-300 hover:text-zinc-950"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <nav className="flex flex-wrap gap-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium hover:-translate-y-0.5 ${
                        isActive
                          ? "border-[var(--accent)]/22 bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                          : "border-[#e6ddd1] bg-[#faf7f2] text-zinc-600 hover:border-zinc-300 hover:bg-white hover:text-zinc-950"
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                })}
              </nav>
            </div>
          </header>
        </Reveal>

        <main className="mt-5 flex-1">{children}</main>
      </div>
    </div>
  );
}
