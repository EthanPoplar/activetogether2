import { HttpsError, onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import sgMail from "@sendgrid/mail";

setGlobalOptions({ region: "australia-southeast1" });
initializeApp();
const db = getFirestore();

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_KEY) {
  sgMail.setApiKey(SENDGRID_KEY);
}

export const sendProgramEmail = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth?.token) {
    throw new HttpsError("unauthenticated", "Login required");
  }

  if (!SENDGRID_KEY) {
    throw new HttpsError("failed-precondition", "Missing SendGrid API key configuration");
  }

  const { programId, subject, message, attachmentUrl } = data || {};
  if (!programId || !subject || !message) {
    throw new HttpsError("invalid-argument", "Program, subject, and message are required");
  }

  const enrollmentSnap = await db.collection("enrollments").where("programId", "==", programId).get();
  if (enrollmentSnap.empty) {
    return { success: false, reason: "no-recipients" };
  }

  const recipients = [];
  enrollmentSnap.forEach((docSnap) => {
    const record = docSnap.data();
    if (record.email) recipients.push(record.email);
  });

  if (!recipients.length) {
    return { success: false, reason: "no-valid-emails" };
  }

  let attachment;
  if (attachmentUrl) {
    const response = await fetch(attachmentUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    attachment = {
      content: base64,
      filename: attachmentUrl.split("/").pop() || "attachment",
      type: response.headers.get("content-type") || "application/octet-stream",
      disposition: "attachment",
    };
  }

  const emails = recipients.map((to) => {
    const payload = {
      to,
      from: process.env.SENDGRID_FROM || "noreply@activetogether.example",
      subject,
      html: `<div>${message}</div>${attachmentUrl ? `<p>Attachment: <a href="${attachmentUrl}">Download</a></p>` : ""}`,
    };
    if (attachment) {
      payload.attachments = [attachment];
    }
    return payload;
  });

  await sgMail.send(emails);

  await db.collection("emailLogs").add({
    sentBy: auth.uid,
    programId,
    subject,
    message,
    recipients,
    sentAt: new Date().toISOString(),
    attachmentUrl: attachmentUrl || null,
  });

  return { success: true, count: recipients.length };
});
