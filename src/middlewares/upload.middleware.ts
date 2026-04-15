import multer from "multer";

/**
 * We use memoryStorage because Cloudflare R2 (AWS SDK)
 * needs the file as a 'buffer' (file.buffer).
 */
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    // Lambda Function URL request payload cap is ~6MB.
    // Keep this below that threshold so Express returns a proper error response.
    fileSize: 5 * 1024 * 1024,
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
