type AdminOfflineStateProps = {
  title: string;
  description: string;
  baseUrl: string;
};

export function AdminOfflineState({
  title,
  description,
  baseUrl,
}: AdminOfflineStateProps) {
  return (
    <section className="rounded-[1.5rem] border border-[#e6ddd1] bg-white p-6 text-zinc-950 shadow-[0_26px_80px_-64px_rgba(15,23,42,0.28)] sm:p-6">
      <p className="text-[11px] font-medium tracking-[0.28em] text-[var(--accent)] uppercase">
        Appwrite connection
      </p>
      <h1 className="mt-2 text-balance text-2xl font-semibold tracking-[-0.05em] text-zinc-950">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">{description}</p>
      <div className="mt-5 rounded-[1.15rem] border border-[#e6ddd1] bg-[#fcfaf7] p-4">
        <p className="text-sm leading-7 text-zinc-600">
          Required collections: <span className="font-semibold text-zinc-950">vpes</span>,{" "}
          <span className="font-semibold text-zinc-950">evaluators</span>, and{" "}
          <span className="font-semibold text-zinc-950">invitations</span>.
        </p>
        <p className="mt-2 text-sm leading-7 text-zinc-600">
          Current Appwrite target: <span className="font-semibold text-zinc-950">{baseUrl}</span>
        </p>
      </div>
    </section>
  );
}
