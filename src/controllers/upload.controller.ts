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

export const proxyObject = async (req: Request, res: Response) => {
  try {
    const keyParam = (req.query.key || req.params.key) as string | undefined;
    if (!keyParam) {
      return res.status(400).json({ message: "key query param is required" });
    }

    const key = decodeURIComponent(keyParam);

    const obj = await uploadService.getObject(key);

    if (!obj || !obj.Body) {
      return res.status(404).json({ message: "Object not found" });
    }

    const contentType = (obj.ContentType as string) || "application/octet-stream";
    if (obj.ContentLength) {
      res.setHeader("Content-Length", String(obj.ContentLength));
    }
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const body: any = obj.Body;

    if (body && typeof body.pipe === "function") {
      return body.pipe(res);
    }

    // Fallbacks for non-stream bodies
    if (body instanceof Uint8Array) {
      return res.send(Buffer.from(body));
    }

    if (typeof body === "string") {
      return res.send(body);
    }

    // Attempt to iterate async iterable
    const chunks: any[] = [];
    for await (const chunk of body as any) {
      chunks.push(Buffer.from(chunk));
    }
    return res.send(Buffer.concat(chunks));
  } catch (error: any) {
    console.error("Proxy error:", error);
    const status = error?.$metadata?.httpStatusCode || 500;
    return res.status(status).json({ message: error.message || "Proxy failed" });
  }
};
