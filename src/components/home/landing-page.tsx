"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { LandingVisualCarousel } from "@/components/home/landing-visual-carousel";
import { Reveal } from "@/components/motion/reveal";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

type LandingPageProps = {
  loginAction?: (formData: FormData) => void | Promise<void>;
  signupAction?: (formData: FormData) => void | Promise<void>;
  loginErrorMessage?: string;
  signupErrorMessage?: string;
  signupSuccessMessage?: string;
  persistSignupSuccess?: boolean;
  nextPath?: string;
  initialMode?: "login" | "signup";
};

export function LandingPage({
  loginAction,
  signupAction,
  loginErrorMessage,
  signupErrorMessage,
  signupSuccessMessage,
  persistSignupSuccess = false,
  nextPath = "/admin",
  initialMode = "login",
}: LandingPageProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [dismissedFlashKey, setDismissedFlashKey] = useState("");

  const signupSuccessKey = signupSuccessMessage ? `success:${signupSuccessMessage}` : "";
  const signupErrorKey = signupErrorMessage ? `error:${signupErrorMessage}` : "";
  const showSignupSuccess = Boolean(signupSuccessMessage) && dismissedFlashKey !== signupSuccessKey;
  const showSignupError = Boolean(signupErrorMessage) && dismissedFlashKey !== signupErrorKey;

  function clearSignupFlashParams() {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);

    url.searchParams.delete("sent");
    url.searchParams.delete("error");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  useEffect(() => {
    if (!showSignupSuccess || mode !== "signup" || !signupSuccessKey || persistSignupSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissedFlashKey(signupSuccessKey);
      clearSignupFlashParams();
      setMode("login");
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [mode, persistSignupSuccess, showSignupSuccess, signupSuccessKey]);

  useEffect(() => {
    if (!showSignupError || mode !== "signup" || !signupErrorKey) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissedFlashKey(signupErrorKey);
      clearSignupFlashParams();
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [mode, showSignupError, signupErrorKey]);

  return (
    <main className="overflow-hidden bg-[linear-gradient(180deg,#f8f4ee_0%,#f2eee8_100%)]">
      <section className="relative">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1400px] items-center px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <Reveal className="w-full">
            <section className="overflow-hidden rounded-[2.3rem] border border-[#ddd6cc] bg-white shadow-[0_40px_120px_-70px_rgba(15,23,42,0.28)]">
              <div className="grid lg:grid-cols-[minmax(0,1.14fr)_minmax(24rem,0.86fr)] lg:items-stretch">
                <LandingVisualCarousel />

                <div className="border-t border-[#e8e0d5] p-5 text-zinc-950 sm:p-6 lg:border-t-0 lg:border-l">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="inline-flex items-center rounded-full border border-[#e5ddd2] bg-[#faf7f2] px-3 py-1.5 text-[11px] font-medium tracking-[0.24em] text-zinc-500 uppercase">
                        Club access
                      </div>
                        <RadarIndicator />
                    </div>

                    <div className="space-y-2">
                      <h1 className="max-w-md text-balance text-[2rem] font-semibold tracking-[-0.06em] text-zinc-950 sm:text-[2.25rem]">
                        Welcome VPE!
                      </h1>
                      <p className="max-w-sm text-sm leading-7 text-zinc-600">
                        Kindly login to manage evaluators confirmations
                      </p>
                    </div>

                    <div className="grid grid-cols-2 rounded-full border border-[#e5ddd2] bg-[#f5f0e8] p-1">
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        aria-pressed={mode === "login"}
                        className={`inline-flex h-11 items-center justify-center rounded-full text-sm font-medium transition ${
                          mode === "login"
                            ? "bg-zinc-950 text-white"
                            : "text-zinc-500 hover:text-zinc-950"
                        }`}
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("signup")}
                        aria-pressed={mode === "signup"}
                        className={`inline-flex h-11 items-center justify-center rounded-full text-sm font-medium transition ${
                          mode === "signup"
                            ? "bg-zinc-950 text-white"
                            : "text-zinc-500 hover:text-zinc-950"
                        }`}
                      >
                        Request code
                      </button>
                    </div>

                    {mode === "login" ? (
                      <form
                        action={loginAction}
                        className="rounded-[1.6rem] border border-[#e5ddd2] bg-[#fcfaf7] p-4"
                      >
                        <input type="hidden" name="next" value={nextPath} />

                        <div className="space-y-2">
                          <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-950">
                            Login to your workspace
                          </h2>
                          <p className="text-sm leading-7 text-zinc-600">
                            Use the access code that was sent to your email.
                          </p>
                        </div>

                        <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-800">
                          <span>Access code</span>
                          <input
                            name="accessCode"
                            type="password"
                            placeholder="Enter your access code"
                            autoComplete="one-time-code"
                            required
                            className="h-12 rounded-[1rem] border border-[#e5ddd2] bg-white px-4 text-base text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
                          />
                        </label>

                        {loginErrorMessage ? (
                          <p className="mt-3 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900 shadow-[0_16px_40px_-30px_rgba(190,24,93,0.35)]">
                            {loginErrorMessage}
                          </p>
                        ) : null}

                        <PendingSubmitButton
                          pendingLabel="Logging in..."
                          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-zinc-800"
                        >
                          Login
                        </PendingSubmitButton>

                        <div className="mt-4 rounded-[1.4rem] border border-[#e5ddd2] bg-[#f7f2eb] px-4 py-4 text-sm text-zinc-600">
                          No access code yet?{" "}
                          <button
                            type="button"
                            onClick={() => setMode("signup")}
                            className="font-medium text-zinc-950 hover:text-[var(--accent)]"
                          >
                            Request one by email
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form
                        action={signupAction}
                        className="rounded-[1.6rem] border border-[#e5ddd2] bg-[#fcfaf7] p-4"
                      >
                        <div className="space-y-2">
                          <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-950">
                            Request a fresh access code
                          </h2>
                          <p className="text-sm leading-7 text-zinc-600">
                            Enter your VPE name and email. We will send a new code for your workspace.
                          </p>
                        </div>

                        <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-800">
                          <span>VPE name</span>
                          <input
                            type="text"
                            name="fullName"
                            placeholder="Enter your name"
                            required
                            className="h-12 rounded-[1rem] border border-[#e5ddd2] bg-white px-4 text-base text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
                          />
                        </label>

                        <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-800">
                          <span>Email address</span>
                          <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                            className="h-12 rounded-[1rem] border border-[#e5ddd2] bg-white px-4 text-base text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
                          />
                        </label>

                        <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-800">
                          <span>OTC</span>
                          <input
                            type="text"
                            name="signupOtc"
                            placeholder="Enter your OTC"
                            autoComplete="one-time-code"
                            required
                            className="h-12 rounded-[1rem] border border-[#e5ddd2] bg-white px-4 text-base text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
                          />
                        </label>

                        {signupErrorMessage && showSignupError ? (
                          <p className="mt-3 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900 shadow-[0_16px_40px_-30px_rgba(190,24,93,0.35)]">
                            {signupErrorMessage}
                          </p>
                        ) : null}

                        {signupSuccessMessage && showSignupSuccess ? (
                          <p className="mt-3 rounded-[1rem] border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-[0_16px_40px_-30px_rgba(5,150,105,0.45)]">
                            {signupSuccessMessage}
                          </p>
                        ) : null}

                        <PendingSubmitButton
                          pendingLabel="Sending access code..."
                          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-zinc-800"
                        >
                          Send access code
                        </PendingSubmitButton>

                        <div className="mt-4 rounded-[1.4rem] border border-[#e5ddd2] bg-[#f7f2eb] px-4 py-4 text-sm text-zinc-600">
                          Already have a code?{" "}
                          <button
                            type="button"
                            onClick={() => setMode("login")}
                            className="font-medium text-zinc-950 hover:text-[var(--accent)]"
                          >
                            Login here
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </Reveal>
        </div>
      </section>

      <section className="px-4 pb-6 sm:px-8 sm:pb-8 lg:px-12 lg:pb-10">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 rounded-[1.5rem] border border-[#ddd6cc] bg-white/90 px-4 py-3 shadow-[0_32px_100px_-70px_rgba(15,23,42,0.22)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="text-xs text-zinc-400">
            <p>
              Toast Masters Hub <span aria-hidden="true">®</span>
              <span className="sr-only">Registered trademark</span> 2026
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2.5 self-start rounded-full border border-[#e5ddd2] bg-[#faf7f2] px-3 py-1.5 text-left hover:-translate-y-0.5 hover:border-[var(--accent)]/26 hover:bg-white sm:self-center"
          >
            <RadarIndicator className="h-8 w-8" />
            <span className="text-xs font-medium text-zinc-600">
              Powered by <span className="text-zinc-950">MitemsHub</span>
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}

function RadarIndicator({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <motion.div
      aria-label="Live radar"
      className={`relative flex items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.96),rgba(250,242,246,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_-18px_rgba(161,55,91,0.28)] ${className}`}
      initial={false}
      animate={{ scale: [1, 1.015, 1] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="absolute inset-[5px] overflow-hidden rounded-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(161,55,91,0.05),transparent_58%)]" />

        <motion.span
          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent)]/22"
          animate={{ scale: [1, 4.2], opacity: [0, 0.58, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.span
          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent)]/18"
          animate={{ scale: [1, 4.2], opacity: [0, 0.46, 0] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.55,
          }}
        />
        <motion.span
          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent)]/14"
          animate={{ scale: [1, 4.2], opacity: [0, 0.34, 0] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: [0.16, 1, 0.3, 1],
            delay: 1.1,
          }}
        />
      </div>

      <motion.span
        className="absolute h-4 w-4 rounded-full bg-[var(--accent)]/16 blur-[1.5px]"
        animate={{
          scale: [0.95, 1.55, 1.05, 0.95],
          opacity: [0.18, 0.72, 0.34, 0.18],
        }}
        transition={{ duration: 2.2, repeat: Infinity, times: [0, 0.14, 0.28, 1], ease: "easeOut" }}
      />
      <motion.span
        className="absolute h-2.5 w-2.5 rounded-full bg-[var(--accent)]"
        animate={{
          scale: [1, 1.28, 1.05, 1],
          filter: [
            "brightness(0.94) saturate(0.92)",
            "brightness(1.28) saturate(1.3)",
            "brightness(1.06) saturate(1.05)",
            "brightness(0.94) saturate(0.92)",
          ],
          boxShadow: [
            "0 0 0 6px rgba(161,55,91,0.08)",
            "0 0 0 10px rgba(161,55,91,0.18)",
            "0 0 0 7px rgba(161,55,91,0.11)",
            "0 0 0 6px rgba(161,55,91,0.08)",
          ],
        }}
        transition={{ duration: 2.2, repeat: Infinity, times: [0, 0.14, 0.28, 1], ease: "easeOut" }}
      />
    </motion.div>
  );
}
