// utils/email.js

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Dr. Dissertation <reviews@doctordissertation.com>";
const REPLY_TO = "drchick@doctordissertation.com";

async function sendEmail({ to, subject, html, text }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      reply_to: REPLY_TO,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Resend error ${res.status}`);
  }
  return res.json();
}

export async function sendWelcomeEmail({ to, firstName }) {
  const name = firstName || "there";
  const subject = "Welcome to Dr. Dissertation! 🎓";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6c3fc5 0%,#9b6ef3 100%);padding:40px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;letter-spacing:-0.5px;">Dr. Dissertation</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Powered by the HAIST© Framework</p>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 16px;font-size:22px;color:#1a1a2e;">Welcome, ${name}! 🎉</h2>
      <p style="margin:0 0 20px;color:#555;line-height:1.6;font-size:15px;">
        You now have access to real HAIST© framework dissertation reviews — the same rigorous methodology used by Dr. Chick with doctoral students.
      </p>

      <h3 style="margin:0 0 12px;color:#1a1a2e;font-size:16px;">How it works:</h3>
      <div style="background:#f8f5ff;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
        <p style="margin:0 0 10px;color:#555;font-size:14px;"><strong style="color:#6c3fc5;">1.</strong> Upload your dissertation or proposal PDF</p>
        <p style="margin:0 0 10px;color:#555;font-size:14px;"><strong style="color:#6c3fc5;">2.</strong> Select document type (proposal or full dissertation)</p>
        <p style="margin:0;color:#555;font-size:14px;"><strong style="color:#6c3fc5;">3.</strong> Receive a detailed HAIST© review in minutes</p>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="https://www.doctordissertation.com/dashboard" style="background:linear-gradient(135deg,#6c3fc5,#9b6ef3);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;display:inline-block;">
          Go to My Dashboard →
        </a>
      </div>

      <p style="margin:24px 0 0;color:#999;font-size:13px;text-align:center;">
        Questions? Reply to this email or reach out at <a href="mailto:drchick@doctordissertation.com" style="color:#6c3fc5;">drchick@doctordissertation.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Welcome to Dr. Dissertation, ${name}!\n\nYou now have access to real HAIST© framework reviews.\n\nGo to your dashboard: https://www.doctordissertation.com/dashboard\n\nQuestions? Email drchick@doctordissertation.com`;

  return sendEmail({ to, subject, html, text });
}

export async function sendReviewCompletionEmail({ to, firstName, reviewTitle }) {
  const name = firstName || "there";
  const subject = "Your HAIST© Review is Ready 📄";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6c3fc5 0%,#9b6ef3 100%);padding:40px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;">Dr. Dissertation</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Your review is ready</p>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 16px;font-size:22px;color:#1a1a2e;">Hi ${name}, your review is ready!</h2>
      <p style="margin:0 0 20px;color:#555;line-height:1.6;">
        Your HAIST© review for <strong>${reviewTitle || "your document"}</strong> has been completed.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://www.doctordissertation.com/dashboard" style="background:linear-gradient(135deg,#6c3fc5,#9b6ef3);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;display:inline-block;">
          View My Review →
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `Hi ${name}, your HAIST© review is ready!\n\nView it at: https://www.doctordissertation.com/dashboard`;
  return sendEmail({ to, subject, html, text });
}

export async function sendFullReviewNotificationEmail({ userEmail, userName, fileName, documentType, submissionId }) {
  const subject = `📋 New Full Review Submission — ${fileName}`;
  const typeLabel = documentType === "proposal" ? "Proposal (Chapters 1–3)" : "Full Dissertation (Chapters 1–5)";
  const html = `
<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6c3fc5,#9b6ef3);border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <h2 style="color:#fff;margin:0;font-size:20px;">New Full Review Submission</h2>
    </div>
    <p style="color:#555;font-size:15px;margin:0 0 16px;"><strong>From:</strong> ${userName || userEmail} (${userEmail})</p>
    <p style="color:#555;font-size:15px;margin:0 0 8px;"><strong>File:</strong> ${fileName}</p>
    <p style="color:#555;font-size:15px;margin:0 0 24px;"><strong>Type:</strong> ${typeLabel}</p>
    <a href="https://www.doctordissertation.com/admin" style="background:linear-gradient(135deg,#6c3fc5,#9b6ef3);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">
      View in Admin Panel →
    </a>
    <p style="color:#aaa;font-size:12px;margin:24px 0 0;">Submission ID: ${submissionId}</p>
  </div>
</body></html>`;
  const text = `New Full Review Submission\n\nFrom: ${userName || userEmail} (${userEmail})\nFile: ${fileName}\nType: ${typeLabel}\n\nView in admin: https://www.doctordissertation.com/admin\nSubmission ID: ${submissionId}`;
  return sendEmail({ to: "jchick@bridgeport.edu", subject, html, text });
}

export async function sendContactEmail({ name, email, message }) {
  const subject = `Contact Form: Message from ${name}`;
  const html = `
<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;">
  <h2>New Contact Message</h2>
  <p><strong>From:</strong> ${name} (${email})</p>
  <p><strong>Message:</strong></p>
  <p style="background:#f5f5f5;padding:16px;border-radius:8px;">${message.replace(/\n/g, "<br>")}</p>
</body></html>`;
  const text = `From: ${name} (${email})\n\n${message}`;
  return sendEmail({ to: process.env.ADMIN_EMAIL || "jchick@bridgeport.edu", subject, html, text });
}
