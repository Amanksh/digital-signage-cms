import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

if (
  !process.env.REGION ||
  !process.env.KEY_ID ||
  !process.env.ACCESS_KEY ||
  !process.env.AWS_BUCKET_NAME
) {
  throw new Error("Missing required AWS environment variables");
}

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.KEY_ID,
    secretAccessKey: process.env.ACCESS_KEY,
  },
});

export async function uploadToS3(file: File, key: string) {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      ContentType: file.type,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    // Upload the file using the signed URL
    const upload = await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!upload.ok) {
      const errorText = await upload.text();
      throw new Error(`Failed to upload file to S3: ${errorText}`);
    }

    // Return the public URL
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("[S3_UPLOAD_ERROR]", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to upload file to S3"
    );
  }
}

export function generateS3Key(file: File, userId: string) {
  const timestamp = Date.now();
  const extension = file.name.split(".").pop();
  return `${userId}/${timestamp}-${file.name}`;
}
