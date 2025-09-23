import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  },
  forcePathStyle: true,
  signatureVersion: "v4",
});

// Upload function
export const uploadToR2 = async (fileBuffer, fileName, mimeType) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    const result = await r2Client.send(command);
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
    
    return publicUrl;
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error("Failed to upload file to cloud storage");
  }
};

// Delete function with better debugging and error handling
export const deleteFromR2 = async (fileName) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName
    });

    const result = await r2Client.send(command);
    console.log(`Successfully deleted file: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`R2 delete error for ${fileName}:`, error);
    return false;
  }
};

export { r2Client };
