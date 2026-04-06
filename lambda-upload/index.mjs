import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// 1. Initialize the S3 Client with your R2 credentials
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Crucial for Cloudflare R2
});

export const handler = async (event) => {
  try {
    // Parse the body sent from your Express Backend
    const body = JSON.parse(event.body);

    if (!body.image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No image data provided" }),
      };
    }

    // Capture the folder from the request, or default to 'general'
    const folder = body.folder || "uploads";
    const fileName = `${folder}/upload-${Date.now()}.png`;

    // CONVERT BASE64 STRING TO BUFFER (The part that was missing)
    const buffer = Buffer.from(body.image, "base64");

    // 2. Prepare the upload command
    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: "image/png",
    };

    // 3. Execute the upload to Cloudflare
    await s3.send(new PutObjectCommand(uploadParams));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Upload successful!",
        // Return the full public URL so your Backend can save it to TiDB
        url: `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${fileName}`,
      }),
    };
  } catch (error) {
    console.error("Lambda Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Upload failed",
        error: error.message,
      }),
    };
  }
};
//trigger deploy test
