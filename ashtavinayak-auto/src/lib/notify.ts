import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";
import { sendMail } from "@/lib/mailer";

export async function createNotification(input: {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  emailAdmin?: boolean;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
      },
    });
    if (input.emailAdmin && process.env.ADMIN_EMAIL) {
      await sendMail({
        to: process.env.ADMIN_EMAIL,
        subject: input.title,
        text: input.body ?? input.title,
      });
    }
  } catch (error) {
    console.error("[notify] failed to create notification", error);
  }
}
