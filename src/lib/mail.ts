import nodemailer from "nodemailer";

export async function sendInviteEmail(to: string, inviteUrl: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  if (!host || !process.env.SMTP_USER || !process.env.SMTP_PASS) return false;

  const port = Number(process.env.SMTP_PORT || "587");
  const secure = process.env.SMTP_SECURE === "true";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: `Uitnodiging voor GLXY — account aanmaken`,
    text: `Je bent uitgenodigd voor het GLXY-team.\n\nAccount aanmaken:\n${inviteUrl}\n\nDeze link is eenmalig en verloopt binnenkort.`,
    html: `<p>Je bent uitgenodigd voor het <strong>GLXY</strong>-team.</p><p><a href="${inviteUrl}">Account aanmaken</a></p><p style="font-size:12px;color:#666;">Deze link is eenmalig en verloopt binnenkort.</p>`,
  });
  return true;
}
