import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class UploadService {
  private s3: S3Client;
  private bucketName: string;

  private normalizeObjectKey(input: string) {
    let value = String(input || "").trim();
    if (!value) {
      return value;
    }

    // Remove query string if the caller passes a URL-like value.
    const qIndex = value.indexOf("?");
    if (qIndex >= 0) {
      value = value.slice(0, qIndex);
    }

    try {
      const parsed = new URL(value);
      value = parsed.pathname || value;
    } catch {
      // Keep raw key if not a URL.
    }

    value = value.replace(/^\/+/, "");

    if (this.bucketName && value.startsWith(`${this.bucketName}/`)) {
      value = value.slice(this.bucketName.length + 1);
    }

    try {
      value = decodeURIComponent(value);
    } catch {
      // keep original value when decode fails
    }

    return value;
  }

  constructor() {
    // Accept multiple common env names as fallbacks to be flexible
    this.bucketName =
      process.env.R2_BUCKET_NAME ||
      process.env.R2_BUCKET ||
      process.env.BUCKET_NAME ||
      "";
    this.s3 = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true,
    });
  }

  /**
   * Generate presigned PUT URLs for direct client uploads to R2.
   * files: [{ filename, contentType, folder? }]
   */
  async getPresignedUploadUrls(
    files: Array<{ filename: string; contentType: string; folder?: string }>,
    expiresIn = 3600,
  ) {
    if (!this.bucketName) {
      throw new Error(
        "R2_BUCKET_NAME is not set. Please set R2_BUCKET_NAME in your environment (.env.development or .env.production).",
      );
    }

    const uploads: Array<{ key: string; url: string; publicUrl: string }> = [];

    for (const f of files) {
      const folder = f.folder || "uploads";
      const ts = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const sanitized = f.filename
        .replace(/\s+/g, "_")
        .replace(/[^\w.\-]+/g, "");
      const key = `${folder}/${ts}_${rand}_${sanitized}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: f.contentType,
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn });
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      uploads.push({ key, url, publicUrl });
    }

    return uploads;
  }

  /**
   * Fetch an object from R2/S3 and return the raw response from the SDK.
   * Caller is responsible for streaming the Body to the HTTP response.
   */
  async getObject(key: string, range?: string) {
    if (!this.bucketName) {
      throw new Error("R2_BUCKET_NAME is not set. Cannot fetch object.");
    }

    const normalizedKey = this.normalizeObjectKey(key);

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: normalizedKey,
      ...(range ? { Range: range } : {}),
    });

    const result = await this.s3.send(command);
    return result;
  }
}

export const uploadService = new UploadService();
