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

export async function getSignedUploadUrl(file: File, key: string) {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      ContentType: file.type,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return {
      signedUrl,
      publicUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${key}`,
    };
  } catch (error) {
    console.error("[S3_SIGNED_URL_ERROR]", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get signed URL"
    );
  }
}

export function generateS3Key(file: File, userEmail: string) {
  // Sanitize the email to use as folder name
  const folderName = userEmail.replace(/[^a-zA-Z0-9]/g, "-");
  // Use just the file name without timestamp
  return `${folderName}/${file.name}`;
}
