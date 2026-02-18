// pages/auth/callback.jsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Ensure a users table row exists for OAuth (Google) sign-ins
    async function ensureProfile(session) {
      if (!session) return;
      const { user } = session;
      // Check if profile row already exists
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();
      if (!existing) {
        // Insert profile row for OAuth users (email signup creates this separately)
        await supabase.from("users").insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
          credits_quicklook_first: 0,
          credits_quicklook_regular: 0,
          credits_full_review: 0,
          mailing_list_opt_in: false,
        });
      }
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await ensureProfile(session);
        // Trigger welcome email non-blockingly
        fetch("/api/email/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
        }).catch(() => {});

        router.push("/dashboard");
      }
    });

    // Also handle the code exchange for PKCE
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        await ensureProfile(data.session);
        fetch("/api/email/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.session.user.id }),
        }).catch(() => {});
        router.push("/dashboard");
      } else if (error) {
        router.push("/auth/login?error=callback_failed");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#6c3fc5,#9b6ef3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Signing you in…</p>
      </div>
    </div>
  );
}
