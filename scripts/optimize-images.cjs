/**
 * Image Optimization Script
 * Converts all JPG/PNG images in src/assets/images to WebP format
 * while keeping the originals as fallbacks (adjustment #6).
 *
 * Usage: node scripts/optimize-images.js
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.resolve(__dirname, '../src/assets/images');
const QUALITY = 80;

async function optimizeImages() {
  const files = fs.readdirSync(IMAGES_DIR);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));

  console.log(`\n🖼️  Found ${imageFiles.length} images to optimize...\n`);

  let totalOriginalSize = 0;
  let totalWebpSize = 0;

  for (const file of imageFiles) {
    const inputPath = path.join(IMAGES_DIR, file);
    const outputName = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const outputPath = path.join(IMAGES_DIR, outputName);

    const originalStats = fs.statSync(inputPath);
    totalOriginalSize += originalStats.size;

    try {
      await sharp(inputPath)
        .webp({ quality: QUALITY })
        .toFile(outputPath);

      const webpStats = fs.statSync(outputPath);
      totalWebpSize += webpStats.size;

      const savings = ((1 - webpStats.size / originalStats.size) * 100).toFixed(1);
      console.log(
        `  ✅ ${file} (${(originalStats.size / 1024 / 1024).toFixed(2)} MB) → ${outputName} (${(webpStats.size / 1024 / 1024).toFixed(2)} MB) — ${savings}% smaller`
      );
    } catch (err) {
      console.error(`  ❌ Failed to convert ${file}:`, err.message);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Original total: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  WebP total:     ${(totalWebpSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Savings:        ${((1 - totalWebpSize / totalOriginalSize) * 100).toFixed(1)}%`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`💡 Original files are kept as fallbacks. The image loader will try .webp first.`);
}

optimizeImages().catch(console.error);
