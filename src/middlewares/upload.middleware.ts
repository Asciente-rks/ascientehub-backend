import multer from "multer";

/**
 * We use memoryStorage because Cloudflare R2 (AWS SDK)
 * needs the file as a 'buffer' (file.buffer).
 */
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for direct R2 uploads
  },
  fileFilter: (req, file, cb) => {
    // Basic validation to ensure we only get images and videos
    if (file.fieldname === "thumbnail") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Thumbnail must be an image.") as any, false);
      }
    } else if (file.fieldname === "trailer") {
      if (file.mimetype.startsWith("video/")) {
        cb(null, true);
      } else {
        cb(new Error("Trailer must be a video.") as any, false);
      }
    } else {
      cb(null, true);
    }
  },
});
