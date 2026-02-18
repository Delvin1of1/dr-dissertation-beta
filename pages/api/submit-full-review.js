// pages/api/submit-full-review.js
// Handles Full Review submissions: stores PDF in Supabase Storage,
// records submission in DB, deducts a full_review credit, notifies admin by email.

import { createClient } from "@supabase/supabase-js";
import { sendFullReviewNotificationEmail } from "../../utils/email";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const config = {
  api: { bodyParser: { sizeLimit: "52mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId, fileName, documentType, fileContent } = req.body || {};
  if (!userId || !fileName || !fileContent) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Load user profile
  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .select("email, full_name, credits_full_review, credits_quicklook_regular, credits_quicklook_first, credits")
    .eq("id", userId)
    .single();

  if (userErr || !user) return res.status(404).json({ error: "User not found" });

  // Check they have a full review credit (or any credit as fallback)
  const fullCredits = user.credits_full_review ?? 0;
  const qlFirst = user.credits_quicklook_first ?? 0;
  const qlReg = user.credits_quicklook_regular ?? 0;
  const legacy = user.credits ?? 0;
  const total = fullCredits + qlFirst + qlReg + legacy;

  if (total <= 0) {
    return res.status(400).json({ error: "No credits remaining" });
  }

  try {
    // Decode base64 PDF and upload to Supabase Storage
    const base64Data = fileContent.replace(/^data:.+;base64,/, "");
    const fileBuffer = Buffer.from(base64Data, "base64");
    const storagePath = `full-reviews/${userId}/${Date.now()}_${fileName}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("dissertation-pdfs")
      .upload(storagePath, fileBuffer, { contentType: "application/pdf", upsert: false });

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr.message);
      return res.status(500).json({ error: "Failed to store PDF: " + uploadErr.message });
    }

    // Insert submission record into reviews table with review_type = 'full_review_pending'
    const { data: submission, error: insertErr } = await supabaseAdmin
      .from("reviews")
      .insert({
        user_id: userId,
        file_name: fileName,
        document_type: documentType || "full",
        review_type: "full_review_pending",
        storage_path: storagePath,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr.message);
      return res.status(500).json({ error: "Failed to record submission" });
    }

    // Deduct credit — prefer credits_full_review, then fall back
    const updates = {};
    if (fullCredits > 0) {
      updates.credits_full_review = fullCredits - 1;
    } else if (qlFirst > 0) {
      updates.credits_quicklook_first = qlFirst - 1;
    } else if (qlReg > 0) {
      updates.credits_quicklook_regular = qlReg - 1;
    } else {
      updates.credits = legacy - 1;
    }
    await supabaseAdmin.from("users").update(updates).eq("id", userId);

    // Notify admin by email (non-blocking)
    sendFullReviewNotificationEmail({
      userEmail: user.email,
      userName: user.full_name,
      fileName,
      documentType: documentType || "full",
      submissionId: submission.id,
    }).catch((e) => console.error("Admin email error:", e.message));

    return res.status(200).json({ ok: true, submissionId: submission.id });
  } catch (err) {
    console.error("submit-full-review error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
