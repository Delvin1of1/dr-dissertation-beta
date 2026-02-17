// components/Navigation.jsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";

export default function Navigation() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-logo">
          Dr. <span>Dissertation</span>
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/#features" className="nav-link">Features</Link>
          <Link href="/#pricing" className="nav-link">Pricing</Link>
          <Link href="/contact" className="nav-link">Contact</Link>
        </div>
        <div className="nav-actions">
          {session ? (
            <>
              <Link href="/dashboard" className="btn-nav-login">Dashboard</Link>
              <button onClick={handleSignOut} className="btn-nav-cta" style={{ background: "#f1f5f9", color: "#6366F1" }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-nav-login">Login</Link>
              <Link href="/auth/signup" className="btn-nav-cta">Get Started →</Link>
            </>
          )}
        </div>
        <button className="nav-hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? "✕" : "☰"}
        </button>
      </nav>
      <div className={`nav-mobile ${mobileOpen ? "open" : ""}`}>
        <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
        <Link href="/#features" onClick={() => setMobileOpen(false)}>Features</Link>
        <Link href="/#pricing" onClick={() => setMobileOpen(false)}>Pricing</Link>
        <Link href="/contact" onClick={() => setMobileOpen(false)}>Contact</Link>
        {session ? (
          <>
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
            <button onClick={handleSignOut} style={{ color: "#e74c3c", background: "none", border: "none", textAlign: "left", fontSize: 16, fontWeight: 500, padding: "8px 0", cursor: "pointer" }}>Sign Out</button>
          </>
        ) : (
          <>
            <Link href="/auth/login" onClick={() => setMobileOpen(false)}>Login</Link>
            <Link href="/auth/signup" className="btn-nav-cta" onClick={() => setMobileOpen(false)}>Get Started →</Link>
          </>
        )}
      </div>
    </>
  );
}
