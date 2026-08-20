/**
 * Email delivery. When SMTP credentials are not configured (the default in
 * development), messages are logged to the server console instead — the
 * application never depends on email being available.
 */
export async function sendMail(message: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const host = process.env.EMAIL_SERVER_HOST;
  if (!host) {
    console.info(`[mailer] (not configured) would send to=${message.to} subject="${message.subject}"`);
    return;
  }
  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.EMAIL_SERVER_PORT || 587),
      auth: process.env.EMAIL_SERVER_USER
        ? {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          }
        : undefined,
    });
    await transport.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  } catch (error) {
    console.error("[mailer] failed to send email", error);
  }
}
