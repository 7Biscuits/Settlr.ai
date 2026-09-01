import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { AppError, ValidationError } from "../utils/errors.js";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "application/pdf": ".pdf",
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadReceiptResult {
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

export async function getSignedReceiptUrl(
  path: string,
  expiresInSeconds: number = 3600,
): Promise<string> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError(
      503,
      "Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
    );
  }

  const baseUrl = env.SUPABASE_URL.replace(/\/$/, "");
  const signUrl = `${baseUrl}/storage/v1/object/sign/${env.SUPABASE_STORAGE_BUCKET}/${path}`;

  const response = await fetch(signUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to generate signed URL (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { signedURL?: string };
  if (data.signedURL) {
    return data.signedURL.startsWith("http")
      ? data.signedURL
      : `${baseUrl}${data.signedURL}`;
  }

  return `${baseUrl}/storage/v1/object/sign/${env.SUPABASE_STORAGE_BUCKET}/${path}`;
}

/**
 * Uploads a receipt or payment proof image to Supabase's private Storage.
 * Accepts Base64 data from mobile/web clients and returns a short-lived secure signed URL.
 */
export async function uploadReceipt(input: {
  userId: string;
  imageBase64: string;
  mimeType?: string;
  fileName?: string;
}): Promise<UploadReceiptResult> {
  const mimeType = (input.mimeType ?? "image/jpeg").toLowerCase();
  const ext = MIME_EXTENSION_MAP[mimeType];
  if (!ext) {
    throw new ValidationError(
      `Unsupported file type "${mimeType}". Allowed types: JPEG, PNG, WebP, HEIC, PDF.`,
    );
  }

  // Strip optional data URI prefix if present
  let rawBase64 = input.imageBase64;
  const commaIndex = rawBase64.indexOf(",");
  if (commaIndex !== -1 && rawBase64.slice(0, commaIndex).includes("base64")) {
    rawBase64 = rawBase64.slice(commaIndex + 1);
  }

  const buffer = Buffer.from(rawBase64, "base64");
  if (buffer.length === 0) {
    throw new ValidationError("Uploaded file is empty");
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(
      `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds 10 MB limit`,
    );
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError(
      503,
      "Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
    );
  }

  const path = `expenses/${input.userId}/${randomUUID()}${ext}`;
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, "");
  const uploadUrl = `${baseUrl}/storage/v1/object/${env.SUPABASE_STORAGE_BUCKET}/${path}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": mimeType,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Supabase Storage upload failed (${response.status}): ${errText}`);
  }

  const signedUrl = await getSignedReceiptUrl(path, 3600);

  return {
    url: signedUrl,
    path,
    size: buffer.length,
    mimeType,
  };
}

