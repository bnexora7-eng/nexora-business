import nodemailer from "nodemailer";
import crypto from "node:crypto";

function getWebBase() {
  return (process.env.NEXORA_ACCOUNT_URL || "https://bnexora7-eng.github.io/nexora-business/account/").replace(/\/$/, "");
}
const FROM = process.env.SMTP_FROM || process.env.SMTP_USER || "bnexora7@gmail.com";

function getTransport() {
  if (process.env.NODE_ENV === "test" && process.env.SMTP_TEST_MODE === "true") {
    return nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });
  }
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  if (!user) throw Object.assign(new Error("Missing required server variable: SMTP_USER."), { statusCode: 503 });
  if (!pass) throw Object.assign(new Error("Missing required server variable: SMTP_APP_PASSWORD."), { statusCode: 503 });
  return nodemailer.createTransport({
    host, port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || "true") === "true",
    auth: { user, pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000
  });
}

async function sendEmail(message) {
  const apiKey = process.env.BREVO_API_KEY;
  if (apiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        signal: controller.signal,
        headers: { "api-key": apiKey, "accept": "application/json", "content-type": "application/json" },
        body: JSON.stringify({
          sender: { name: "NEXORA", email: process.env.BREVO_FROM || FROM },
          to: [{ email: message.to }],
          subject: message.subject,
          textContent: message.text,
          htmlContent: message.html
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("Brevo email API rejected message:", response.status, result.message || result.code || "unknown error");
        throw Object.assign(new Error("Brevo email API rejected the message (HTTP " + response.status + ")."), { statusCode: 502 });
      }
      console.log("NEXORA email accepted by Brevo:", result.messageId || "message ID unavailable");
      return { messageId: result.messageId };
    } finally {
      clearTimeout(timeout);
    }
  }
  return await getTransport().sendMail({
    from: FROM, to: message.to, subject: message.subject,
    text: message.text, html: message.html
  });
}

export function createActionToken() {
  return crypto.randomBytes(32).toString("base64url");
}
export function hashActionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function sendVerificationEmail(email, token) {
  const url = getWebBase() + "/verify.html?token=" + encodeURIComponent(token);
  return await sendEmail({
    to: email,
    subject: "Confirm your NEXORA email address",
    text: "Welcome to NEXORA. Confirm your email address using this link (valid for 24 hours): " + url + "\n\nIf you did not create this account, you can ignore this message.",
    html: '<div style="font-family:Arial,sans-serif;background:#07111f;color:#eff6ff;padding:32px"><div style="max-width:560px;margin:auto;background:#102238;border:1px solid #29435d;border-radius:16px;padding:28px"><h1 style="letter-spacing:4px">NEXORA</h1><h2>Confirm your email address</h2><p>One more step to activate your NEXORA account.</p><p><a href="' + url + '" style="display:inline-block;background:#62e6c5;color:#061923;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:bold">VERIFY EMAIL</a></p><p style="color:#a8b8ca;font-size:13px">This link expires in 24 hours. If you did not create this account, ignore this email.</p></div></div>'
  });
}

export async function sendPasswordResetEmail(email, token) {
  const url = getWebBase() + "/reset-password.html?token=" + encodeURIComponent(token);
  return await sendEmail({
    to: email,
    subject: "Reset your NEXORA password",
    text: "Use this link to choose a new NEXORA password (valid for 1 hour): " + url + "\n\nIf you did not request this, ignore this message.",
    html: '<div style="font-family:Arial,sans-serif;background:#07111f;color:#eff6ff;padding:32px"><div style="max-width:560px;margin:auto;background:#102238;border:1px solid #29435d;border-radius:16px;padding:28px"><h1 style="letter-spacing:4px">NEXORA</h1><h2>Password reset</h2><p>Choose a new password using the secure link below.</p><p><a href="' + url + '" style="display:inline-block;background:#62e6c5;color:#061923;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:bold">RESET PASSWORD</a></p><p style="color:#a8b8ca;font-size:13px">This link expires in 1 hour. If you did not request this, ignore this email.</p></div></div>'
  });
}
