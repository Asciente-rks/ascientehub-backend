import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// 1. Initialize the S3 Client with your R2 credentials
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export const handler = async (event) => {
  try {
    // For now, we'll assume the image is sent as a Base64 string in the body
    const body = JSON.parse(event.body);
    const buffer = Buffer.from(body.image, "base64");
    const fileName = `upload-${Date.now()}.png`;

    // 2. Prepare the upload command
    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName, // The name the file will have in R2
      Body: buffer,
      ContentType: "image/png",
    };

    // 3. Execute the upload
    await s3.send(new PutObjectCommand(uploadParams));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Upload successful!",
        url: `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${fileName}`,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Upload failed", error: error.message }),
    };
  }
};
