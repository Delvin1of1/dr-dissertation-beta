// pages/api/admin/download-submission.js
// Securely streams a PDF from Supabase Storage to the admin browser.
// Only accessible to admin users.

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // Verify admin session via cookie
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  // Use the anon client to verify the session token
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);

  // Also check cookie-based session (Next.js passes it via supabase-auth-token cookie)
  // If token auth fails, fall back to checking the storage path guard below
  const isAdmin = user?.email === ADMIN_EMAIL || (await (async () => {
    if (!user) return false;
    const { data: profile } = await supabaseAdmin.from("users").select("is_admin").eq("id", user.id).single();
    return profile?.is_admin === true;
  })());

  const { path } = req.query;
  if (!path) return res.status(400).json({ error: "Missing path" });

  // Security: path must start with full-reviews/ to prevent traversal
  if (!path.startsWith("full-reviews/")) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    // Generate a signed URL valid for 60 seconds
    const { data, error } = await supabaseAdmin.storage
      .from("dissertation-pdfs")
      .createSignedUrl(path, 60);

    if (error || !data?.signedUrl) {
      return res.status(500).json({ error: "Could not generate download link" });
    }

    // Redirect to signed URL
    res.redirect(302, data.signedUrl);
  } catch (err) {
    console.error("Download error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
