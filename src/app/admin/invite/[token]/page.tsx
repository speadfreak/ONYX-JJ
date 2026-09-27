import type { Metadata } from "next";
import { InviteAcceptForm } from "./invite-form";

export const metadata: Metadata = {
  title: { absolute: "Admin Invite — JJ ONYX" },
  robots: { index: false, follow: false },
};

/**
 * Public one-time invite setup page. The token in the URL IS the secret —
 * anyone holding a valid, unexpired token may set the password for the
 * invited account exactly once. Reached via the link shown in /admin/team.
 */
export default async function AdminInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-onyx-950 px-5 py-16">
      {/* ambient texture — matches the login page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_20%,rgba(212,168,87,0.07),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cpath d='M60 8 112 60 60 112 8 60Z' fill='none' stroke='%23D4A857' stroke-width='1'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <svg viewBox="0 0 24 24" fill="none" className="mx-auto h-10 w-10" aria-hidden>
            <path d="M12 2 22 12 12 22 2 12Z" stroke="#D4A857" strokeWidth="1.6" />
            <path
              d="M12 6.5 17.5 12 12 17.5 6.5 12Z"
              fill="rgba(212,168,87,0.18)"
              stroke="#D4A857"
              strokeOpacity="0.6"
              strokeWidth="1"
            />
          </svg>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
            <span className="gold-text">JJ</span> ONYX
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
            Admin Invite
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-onyx-900/60 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-9">
          <InviteAcceptForm token={token} />
        </div>
      </div>
    </main>
  );
}
