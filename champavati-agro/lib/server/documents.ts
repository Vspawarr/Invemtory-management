import "server-only";
import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/server/require-session";
import { requireAdmin } from "@/lib/server/auth-guards";
import { logAudit } from "@/lib/server/audit";
import type { DocumentType } from "@prisma/client";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.AADHAAR_ENC_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("AADHAAR_ENC_KEY must be a 32-byte (64 hex char) key.");
  }
  return Buffer.from(hex, "hex");
}

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(".");
}

function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** "123456789012" -> "XXXX XXXX 9012". Never throws on odd lengths — falls back to full mask. */
export function maskAadhaar(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "XXXX XXXX XXXX";
  const last4 = digits.slice(-4);
  return `XXXX XXXX ${last4}`;
}

export async function addFarmerDocument(
  session: AppSession,
  farmerId: string,
  type: DocumentType,
  rawValue: string
) {
  requireAdmin(session);
  const valueMasked = type === "AADHAAR" ? maskAadhaar(rawValue) : `••••${rawValue.slice(-4)}`;
  const doc = await prisma.farmerDocument.create({
    data: { farmerId, type, valueMasked, valueEnc: encrypt(rawValue) },
  });
  await logAudit({
    userId: session.user.id,
    action: "DOCUMENT_ADDED",
    entityType: "FarmerDocument",
    entityId: doc.id,
    metadata: { farmerId, type },
  });
  return { id: doc.id, type: doc.type, valueMasked: doc.valueMasked };
}

/** Only an authenticated admin can ever reach this — every call is audit-logged. */
export async function revealFarmerDocument(session: AppSession, documentId: string) {
  requireAdmin(session);
  const doc = await prisma.farmerDocument.findUnique({ where: { id: documentId } });
  if (!doc) return null;

  await logAudit({
    userId: session.user.id,
    action: "DOCUMENT_VIEWED",
    entityType: "FarmerDocument",
    entityId: doc.id,
    metadata: { farmerId: doc.farmerId, type: doc.type },
  });

  return decrypt(doc.valueEnc);
}
