import "server-only";
import { Resend } from "resend";

type Email = { to: string; subject: string; text: string };

const DARI = process.env.EMAIL_FROM ?? "Ngebola <onboarding@resend.dev>";

/** Mode demo (bawaan di development, atau tanpa RESEND_API_KEY): isi email dicetak di terminal. */
export const emailDemo = () =>
  process.env.EMAIL_MODE === "demo" || (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY);

export async function sendEmail(email: Email): Promise<boolean> {
  if (emailDemo()) {
    console.info(`\n──── EMAIL DEMO (tidak dikirim) ────\nKepada : ${email.to}\nJudul  : ${email.subject}\n\n${email.text}\n────────────────────────────────────\n`);
    return true;
  }
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY belum diatur; email tidak terkirim:", email.subject);
    return false;
  }
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: DARI, ...email });
  if (error) console.error("[email] gagal kirim:", error.message);
  return !error;
}

export const appUrl = (path: string) => `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
