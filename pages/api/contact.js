// pages/api/contact.js
import { sendContactEmail } from "../../utils/email";

export default async function handler(req, res) {
  // CORS: allow requests from the marketing site
  res.setHeader("Access-Control-Allow-Origin", "https://doctordissertation.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, message, role, subject } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: "Missing required fields" });

  // Prepend role/subject so they appear clearly in the email body
  const fullMessage = [
    role    && `Role: ${role}`,
    subject && `Subject: ${subject}`,
    `\n${message}`,
  ].filter(Boolean).join("\n");

  try {
    await sendContactEmail({ name, email, message: fullMessage });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
