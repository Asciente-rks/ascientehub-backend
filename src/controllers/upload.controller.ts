import { Request, Response } from "express";
import { uploadService } from "../services/upload.service";

export const presignUploads = async (req: Request, res: Response) => {
  try {
    const files = req.body.files;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: "files array is required" });
    }

    // files entries: { filename, contentType, folder? }
    const expiresIn = Number(req.body.expiresIn) || 3600;
    const uploads = await uploadService.getPresignedUploadUrls(
      files,
      expiresIn,
    );

    return res.status(200).json({ uploads });
  } catch (error: any) {
    console.error("Presign error:", error);
    return res.status(500).json({ message: error.message || "Presign failed" });
  }
};
