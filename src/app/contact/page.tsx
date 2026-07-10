import { redirect } from "next/navigation";
import { LandingVisualCarousel } from "@/components/home/landing-visual-carousel";
import { Reveal } from "@/components/motion/reveal";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { sendMitemsHubContactEmail } from "@/lib/contact/email";
import { getEnv } from "@/lib/config";
import { createMailTransport } from "@/lib/email/transport";
import { contactLeadSchema } from "@/lib/validation/contact";

type ContactPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const contactWasSent = getSearchParamValue(resolvedSearchParams.sent) === "1";
  const errorType = getSearchParamValue(resolvedSearchParams.error);
  const errorMessage =
    errorType === "invalid-contact"
      ? "Please complete your details before sending."
      : errorType === "contact-config-failed"
        ? "The contact channel is not ready yet. Please try again shortly."
        : errorType === "contact-send-failed"
          ? "We could not send your message right now. Please try again."
          : undefined;
  const successMessage = contactWasSent
    ? "Welcome. Your message has been sent to MitemsHub."
    : undefined;

  async function contactMitemsHub(formData: FormData) {
    "use server";

    try {
      const input = contactLeadSchema.parse({
        fullName: typeof formData.get("fullName") === "string" ? String(formData.get("fullName")) : "",
        email: typeof formData.get("email") === "string" ? String(formData.get("email")) : "",
        projectType: typeof formData.get("projectType") === "string" ? String(formData.get("projectType")) : "",
        message: typeof formData.get("message") === "string" ? String(formData.get("message")) : "",
      });
      const env = getEnv();
      const transporter = createMailTransport();

      await sendMitemsHubContactEmail(
        transporter,
        { fromAddress: env.SMTP_FROM },
        input,
      );
    } catch (error) {
      console.error("MitemsHub contact request failed", error);

      if (typeof error === "object" && error !== null && "issues" in error) {
        redirect("/contact?error=invalid-contact");
      }

      if (typeof error === "object" && error !== null && "message" in error) {
        redirect("/contact?error=contact-send-failed");
      }

      redirect("/contact?error=contact-config-failed");
    }

    redirect("/contact?sent=1");
  }

  return (
    <main className="overflow-hidden bg-[linear-gradient(180deg,#f8f4ee_0%,#f2eee8_100%)]">
      <section className="relative">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1400px] items-center px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <Reveal className="w-full">
            <section className="overflow-hidden rounded-[2.3rem] border border-[#ddd6cc] bg-white shadow-[0_40px_120px_-70px_rgba(15,23,42,0.28)]">
              <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)] lg:items-stretch">
                <LandingVisualCarousel />

                <div className="border-t border-[#e8e0d5] p-5 text-zinc-950 sm:p-6 lg:border-t-0 lg:border-l">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="inline-flex items-center rounded-full border border-[#e5ddd2] bg-[#faf7f2] px-3 py-1.5 text-[11px] font-medium tracking-[0.24em] text-zinc-500 uppercase">
                        Powered by MitemsHub
                      </div>
                      <a
                        href="/login"
                        className="inline-flex h-10 items-center rounded-full border border-[#e5ddd2] bg-white px-4 text-sm font-medium text-zinc-600 hover:-translate-y-0.5 hover:border-zinc-300 hover:text-zinc-950"
                      >
                        Back to login
                      </a>
                    </div>

                    <div className="space-y-2">
                      <h1 className="max-w-md text-balance text-[2rem] font-semibold tracking-[-0.06em] text-zinc-950 sm:text-[2.25rem]">
                        Welcome
                      </h1>
                      <p className="max-w-md text-sm leading-7 text-zinc-600">
                        Need a custom website, app, dashboard, or automation flow? Tell us what you want to build and MitemsHub will get your request by email.
                      </p>
                    </div>

                    <form action={contactMitemsHub} className="rounded-[1.6rem] border border-[#e5ddd2] bg-[#fcfaf7] p-4">
                      <div className="space-y-2">
                        <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-950">
                          Start your custom project
                        </h2>
                        <p className="text-sm leading-7 text-zinc-600">
                          Share a short brief and the type of product you want to build.
                        </p>
                      </div>

                      <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-800">
                        <span>Name</span>
                        <input
                          name="fullName"
                          type="text"
                          placeholder="Your name"
                          required
                          className="h-12 rounded-[1rem] border border-[#e5ddd2] bg-white px-4 text-base text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
                        />
                      </label>

                      <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-800">
                        <span>Email address</span>
                        <input
                          name="email"
                          type="email"
                          placeholder="Your email"
                          autoComplete="email"
                          required
                          className="h-12 rounded-[1rem] border border-[#e5ddd2] bg-white px-4 text-base text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
                        />
                      </label>

                      <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-800">
                        <span>What do you want to build?</span>
                        <select
                          name="projectType"
                          defaultValue="Custom website"
                          className="h-12 rounded-[1rem] border border-[#e5ddd2] bg-white px-4 text-base text-zinc-950 outline-none focus:border-[var(--accent)]"
                        >
                          <option>Custom website</option>
                          <option>Web app</option>
                          <option>Mobile app</option>
                          <option>Automation workflow</option>
                          <option>Dashboard</option>
                          <option>Something else</option>
                        </select>
                      </label>

                      <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-800">
                        <span>Project brief</span>
                        <textarea
                          name="message"
                          rows={5}
                          placeholder="Tell MitemsHub what you need."
                          required
                          className="rounded-[1rem] border border-[#e5ddd2] bg-white px-4 py-3 text-base text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-[var(--accent)]"
                        />
                      </label>

                      {errorMessage ? (
                        <p className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                          {errorMessage}
                        </p>
                      ) : null}

                      {successMessage ? (
                        <p className="mt-4 rounded-[1rem] border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                          {successMessage}
                        </p>
                      ) : null}

                      <PendingSubmitButton
                        pendingLabel="Sending message..."
                        className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-zinc-800"
                      >
                        Send message
                      </PendingSubmitButton>
                    </form>
                  </div>
                </div>
              </div>
            </section>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
