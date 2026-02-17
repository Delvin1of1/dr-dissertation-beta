// pages/index.jsx
// Root redirects to dashboard (authenticated) or login (unauthenticated)
import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/auth/login");
      }
    }
    redirect();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#6c3fc5,#9b6ef3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <h1 style={{ fontWeight: 900, fontSize: 28, margin: "0 0 8px" }}>Dr. Dissertation</h1>
        <p style={{ opacity: 0.8 }}>Loading…</p>
      </div>
    </div>
  );
}
