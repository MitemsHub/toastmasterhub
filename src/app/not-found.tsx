import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f4ee_0%,#f2eee8_100%)] px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-4xl items-center justify-center">
        <section className="w-full max-w-2xl rounded-[1.8rem] border border-[#e6ddd1] bg-white p-8 text-center text-zinc-950 shadow-[0_40px_120px_-70px_rgba(15,23,42,0.28)] sm:p-10">
          <p className="text-[11px] font-medium tracking-[0.28em] text-[var(--accent)] uppercase">
            Page not found
          </p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.06em] text-zinc-950">
            We could not find that page.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-600">
            The link may be out of date, or the page may have moved.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-zinc-800"
            >
              Back to home
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#e6ddd1] bg-[#faf7f2] px-5 text-sm font-semibold text-zinc-700 hover:-translate-y-0.5 hover:border-zinc-300 hover:text-zinc-950"
            >
              Go to login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
