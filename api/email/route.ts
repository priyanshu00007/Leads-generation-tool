import { NextResponse } from "next/server";
import { sendEmail, buildOutreachHtml, buildFollowUpHtml } from "@/lib/email";

export async function POST(req: Request) {
  const { to, subject, message, followUp, businessName, senderName, demoUrl } = (await req.json()) as {
    to: string;
    subject: string;
    message: string;
    followUp?: string;
    businessName: string;
    senderName: string;
    demoUrl?: string;
  };

  if (!to || !subject || !message) {
    return NextResponse.json({ error: "to, subject, and message are required" }, { status: 400 });
  }

  const html = buildOutreachHtml({
    businessName,
    message,
    demoUrl,
    senderName: senderName || "Lead → Launch",
  });

  const result = await sendEmail({
    to,
    subject,
    html,
    text: message,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error, success: false }, { status: 500 });
  }

  // If follow-up provided, schedule info (for now just return it for reference)
  let followUpResult = null;
  if (followUp) {
    const followUpHtml = buildFollowUpHtml({
      businessName,
      message: followUp,
      senderName: senderName || "Lead → Launch",
    });
    followUpResult = {
      ready: true,
      html: followUpHtml,
      text: followUp,
    };
  }

  return NextResponse.json({
    success: true,
    messageId: result.messageId,
    followUp: followUpResult,
  });
}
