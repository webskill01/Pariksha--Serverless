import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

let r2Client = null;

export const getR2Client = () => {
  if (!r2Client && process.env.R2_ENDPOINT) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      },
      forcePathStyle: true,
      signatureVersion: "v4",
    });
  }
  return r2Client;
};

export const uploadToR2 = async (fileBuffer, fileName, mimeType) => {
  try {
    const client = getR2Client();
    if (!client) {
      throw new Error('R2 client not configured');
    }

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
    });
    
    await client.send(command);
    return `${process.env.R2_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error("Failed to upload file to cloud storage");
  }
};

export const deleteFromR2 = async (fileName) => {
  try {
    const client = getR2Client();
    if (!client) return false;

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName
    });

    await client.send(command);
    console.log(`✅ Deleted file: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`❌ R2 delete error for ${fileName}:`, error);
    return false;
  }
};

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files allowed!"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
