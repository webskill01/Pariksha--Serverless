import { S3Client, ListObjectsV2Command, HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
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

async function checkAndFixFiles() {
  try {
    console.log('🔍 Checking R2 files...\n');
    
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
    });
    
    const response = await r2Client.send(listCommand);
    const objects = response.Contents || [];
    
    console.log(`📁 Found ${objects.length} files\n`);
    
    for (const obj of objects) {
      if (obj.Key.endsWith('.pdf')) {
        // Check current metadata
        const headCommand = new HeadObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: obj.Key,
        });
        
        const metadata = await r2Client.send(headCommand);
        const currentDisposition = metadata.ContentDisposition || 'NOT SET';
        
        console.log(`📄 ${obj.Key}`);
        console.log(`   Current: ${currentDisposition}`);
        
        if (currentDisposition !== 'inline') {
          console.log(`   ⚠️  Fixing...`);
          
          // Fix the metadata
          const copyCommand = new CopyObjectCommand({
            Bucket: process.env.R2_BUCKET,
            CopySource: `${process.env.R2_BUCKET}/${obj.Key}`,
            Key: obj.Key,
            ContentType: 'application/pdf',
            ContentDisposition: 'inline',
            MetadataDirective: 'REPLACE',
          });
          
          await r2Client.send(copyCommand);
          console.log(`   ✅ Fixed to: inline\n`);
        } else {
          console.log(`   ✅ Already correct\n`);
        }
      }
    }
    
    console.log('🎉 All files checked and fixed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndFixFiles();
