import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import axios from "axios";

export class StorageService {
  private s3: S3Client;
  private bucketName: string;
  private lambdaUrl: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME || "";
    this.lambdaUrl = process.env.LAMBDA_UPLOAD_URL || ""; // Ensure this is in your .env

    // We keep the S3 client ONLY for deleteFile or admin tasks
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
   * PRO WAY: Offloads the heavy upload work to AWS Lambda
   */
  // Inside StorageService class in storage.service.ts

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    try {
      // Check file size before attempting upload
      const fileSizeMB = file.size / (1024 * 1024);

      // 50MB limit for direct R2 uploads (no payload encoding overhead)
      if (fileSizeMB > 50) {
        throw new Error(
          `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum allowed is 50MB.`,
        );
      }

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileKey = `${folder}/${timestamp}-${file.originalname}`;

      // Upload directly to R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3.send(command);

      // Return the public URL
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;
      return publicUrl;
    } catch (error: any) {
      console.error("R2 Direct Upload Error:", error.message);

      if (error.message.includes("too large")) {
        throw error;
      }

      throw new Error(`Cloud Upload Failed: ${error.message}`);
    }
  }

  /**
   * Deletes a file directly from R2 using S3 Admin keys
   */
  async deleteFile(fileKey: string | null): Promise<void> {
    if (!fileKey) return;

    // If the saved key is a full URL, extract just the filename
    const cleanKey = fileKey.includes("/") ? fileKey.split("/").pop() : fileKey;

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: cleanKey!,
    });

    try {
      await this.s3.send(command);
      console.log(`🗑️ Successfully deleted file from R2: ${cleanKey}`);
    } catch (error: any) {
      console.error(`❌ Failed to delete file ${cleanKey}:`, error.message);
    }
  }

  /**
   * Helper method to get the full public link
   */
  getFileUrl(key: string): string {
    // If you already saved the full URL from the Lambda, just return it
    if (key.startsWith("http")) return key;
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }
}
