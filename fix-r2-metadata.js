import { S3Client, ListObjectsV2Command, CopyObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function fixAllPDFs() {
  try {
    console.log('🔧 Starting R2 metadata fix...');
    
    // List all objects
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
    });
    
    const response = await r2Client.send(listCommand);
    const objects = response.Contents || [];
    
    console.log(`📁 Found ${objects.length} files`);
    
    // Fix each PDF
    for (const obj of objects) {
      if (obj.Key.endsWith('.pdf')) {
        console.log(`  ✓ Fixing: ${obj.Key}`);
        
        // Copy object to itself with new metadata
        const copyCommand = new CopyObjectCommand({
          Bucket: process.env.R2_BUCKET,
          CopySource: `${process.env.R2_BUCKET}/${obj.Key}`,
          Key: obj.Key,
          ContentType: 'application/pdf',
          ContentDisposition: 'inline', // Force inline
          MetadataDirective: 'REPLACE',
        });
        
        await r2Client.send(copyCommand);
      }
    }
    
    console.log('✅ All PDFs fixed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAllPDFs();
