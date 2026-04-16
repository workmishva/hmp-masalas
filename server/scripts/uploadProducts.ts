import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadImages = async () => {
  try {
    const frontendDir = path.join(__dirname, '../../src');
    const imagesDir = path.join(frontendDir, 'assets/images');
    const contextFilePath = path.join(frontendDir, 'app/context/ProductCatalogContext.tsx');

    // Read the file
    let contextData = fs.readFileSync(contextFilePath, 'utf8');

    // Find all image variants
    const imageRegex = /image:\s*'([^']+)'/g;
    let match;
    const imagesToUpload = new Set<string>();

    while ((match = imageRegex.exec(contextData)) !== null) {
      if (match[1] && !match[1].startsWith('http')) {
        // Also capture the .jpeg variants or the .jpg variants
        let img = match[1];
        if (img.endsWith('.jpeg')) {
          img = img.replace('.jpeg', '.jpg');
        }
        imagesToUpload.add(img);
      }
    }

    console.log(`Found ${imagesToUpload.size} unique images to upload.`);

    const urlMap: Record<string, string> = {};

    for (const imgFile of imagesToUpload) {
      const fullPath = path.join(imagesDir, imgFile);
      if (fs.existsSync(fullPath)) {
        console.log(`Uploading ${imgFile}...`);
        const result = await cloudinary.uploader.upload(fullPath, {
          folder: 'hmp_products',
          use_filename: true,
          unique_filename: false,
          overwrite: true
        });
        console.log(`-> URL: ${result.secure_url}`);
        
        // We will map both .jpg and .jpeg just in case they are in the file
        urlMap[imgFile] = result.secure_url;
        const jpegVariant = imgFile.replace('.jpg', '.jpeg');
        urlMap[jpegVariant] = result.secure_url;
      } else {
        console.warn(`! File not found: ${fullPath}`);
      }
    }

    // Replace in file
    for (const [localName, secureUrl] of Object.entries(urlMap)) {
      // Regex to replace exact match
      const replaceRegex = new RegExp(`image:\\s*'${localName}'`, 'g');
      contextData = contextData.replace(replaceRegex, `image: '${secureUrl}'`);
    }

    // Invalidate local storage key
    contextData = contextData.replace(/STORAGE_KEY\s*=\s*'[^']+'/, `STORAGE_KEY = 'hmp-masala-products-cld'`);

    fs.writeFileSync(contextFilePath, contextData, 'utf8');
    console.log('Migration complete. File updated.');

  } catch (error) {
    console.error('Migration failed:', error);
  }
};

uploadImages();
