import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import nodemailer from "nodemailer";

setGlobalOptions({
  region: "australia-southeast1",
  cors: true,
});
initializeApp();
const db = getFirestore();

const ADMIN_EMAILS = (process.env.ROLES_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = process.env.SMTP_SECURE
  ? String(process.env.SMTP_SECURE).toLowerCase() === "true"
  : SMTP_PORT === 465;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

const transporter = SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

async function isAdmin(uid, email) {
  const normalized = String(email || "").toLowerCase();
  if (ADMIN_EMAILS.includes(normalized)) return true;
  if (!uid) return false;
  try {
    const doc = await db.collection("userProfiles").doc(uid).get();
    return doc.exists && doc.data().role === "admin";
  } catch (err) {
    console.error("Failed to read userProfiles for admin check", err);
    return false;
  }
}

const SAMPLE_PROGRAMS = [
  {
    id: "p1",
    name: "U12 Soccer Clinic",
    venue: "RecWest Footscray",
    when: "Sat 10:00",
    cost: 0,
    tags: ["Kids", "Beginner"],
    accessible: true,
    location: { lat: -37.8036, lng: 144.8881, address: "39 Essex St, Footscray VIC" },
    reviews: [
      { id: "r1", user: "maria", rating: 5, text: "Great coaches!" },
      { id: "r2", user: "james", rating: 4, text: "Well organised." },
    ],
  },
  {
    id: "p2",
    name: "Seniors Tai-Chi",
    venue: "Maribyrnong Hub",
    when: "Tue 09:00",
    cost: 2,
    tags: ["Seniors", "Low impact"],
    accessible: true,
    location: { lat: -37.7914, lng: 144.9123, address: "18-22 Wests Rd, Maribyrnong VIC" },
    reviews: [{ id: "r1", user: "aisha", rating: 5, text: "Inclusive space." }],
  },
  {
    id: "p3",
    name: "Women's Social Basketball",
    venue: "Kensington YMCA",
    when: "Thu 18:30",
    cost: 5,
    tags: ["Women", "Intermediate"],
    accessible: false,
    location: { lat: -37.7961, lng: 144.9311, address: "120 Racecourse Rd, Kensington VIC" },
    reviews: [{ id: "r1", user: "kim", rating: 4, text: "Good workout!" }],
  },
];

export const seedPrograms = onCall(async (request) => {
  const { auth } = request;
  if (!auth?.token?.email) {
    throw new HttpsError("unauthenticated", "Login required");
  }
  const email = String(auth.token.email).toLowerCase();
  const allowed = await isAdmin(auth.uid, email);
  if (!allowed) {
    throw new HttpsError("permission-denied", "Only administrators can seed programs.");
  }

  let seeded = 0;

  for (const program of SAMPLE_PROGRAMS) {
    const docRef = db.collection("programs").doc(program.id);
    await docRef.set(
      {
        name: program.name,
        venue: program.venue,
        when: program.when,
        cost: program.cost,
        tags: program.tags,
        accessible: program.accessible,
        location: program.location || null,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const reviewsRef = docRef.collection("reviews");
    if (program.reviews?.length) {
      await Promise.all(
        program.reviews.map((review, index) =>
          reviewsRef.doc(review.id || `seed-${index}`).set(
            {
              user: review.user,
              rating: review.rating,
              text: review.text,
              createdAt: new Date().toISOString(),
              seeded: true,
            },
            { merge: true }
          )
        )
      );
    }
    seeded += 1;
  }

  await db.collection("appStats").doc("summary").set(
    {
      totalPrograms: seeded,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return { success: true, seeded };
});

export const sendProgramEmail = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth?.token) {
    throw new HttpsError("unauthenticated", "Login required");
  }
  if (!transporter || !SMTP_FROM) {
    throw new HttpsError("failed-precondition", "SMTP credentials missing");
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

  let attachments = [];
  if (attachmentUrl) {
    const response = await fetch(attachmentUrl);
    const buffer = await response.arrayBuffer();
    attachments = [
      {
        filename: attachmentUrl.split("/").pop() || "attachment",
        content: Buffer.from(buffer),
        contentType: response.headers.get("content-type") || "application/octet-stream",
      },
    ];
  }

  const sendPromises = recipients.map((to) =>
    transporter.sendMail({
      to,
      from: SMTP_FROM,
      subject,
      html: `<div>${message}</div>${attachmentUrl ? `<p>Attachment: <a href="${attachmentUrl}">Download</a></p>` : ""}`,
      attachments,
    })
  );

  await Promise.all(sendPromises);

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

export const onEnrollmentCreated = onDocumentCreated("enrollments/{enrollmentId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data();
  if (!data?.programId) return;

  const programId = data.programId;
  const programName = data.programName || "";
  const participantEmail = String(data.email || "").toLowerCase();

  const statsRef = db.collection("programStats").doc(programId);
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(statsRef);
    const existing = current.exists ? current.data() : {};
    const participantEmails = new Set(existing.participantEmails || []);
    if (participantEmail) participantEmails.add(participantEmail);

    transaction.set(
      statsRef,
      {
        programId,
        programName: programName || existing.programName || "",
        enrollments: (existing.enrollments || 0) + 1,
        participantEmails: Array.from(participantEmails),
        uniqueParticipants: participantEmails.size,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  });

  const summaryRef = db.collection("appStats").doc("summary");
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(summaryRef);
    const existing = current.exists ? current.data() : {};
    const participantEmails = new Set(existing.participantEmails || []);
    if (participantEmail) participantEmails.add(participantEmail);

    transaction.set(
      summaryRef,
      {
        totalEnrollments: (existing.totalEnrollments || 0) + 1,
        participantEmails: Array.from(participantEmails),
        uniqueParticipants: participantEmails.size,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  });
});
