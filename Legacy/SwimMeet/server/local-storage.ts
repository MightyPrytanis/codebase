import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import zlib from 'zlib';

export class LocalFileStorage {
  private uploadDir: string;
  private compressionEnabled: boolean = true; // Enable gzip compression by default

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const fileId = randomUUID();
    const extension = path.extname(file.originalname);
    const filename = `${fileId}${extension}`;
    const filePath = path.join(this.uploadDir, filename);

    let dataToSave = file.buffer;
    
    // Apply gzip compression for files over 1KB to save space
    if (this.compressionEnabled && file.buffer.length > 1024) {
      try {
        dataToSave = zlib.gzipSync(file.buffer);
        // Add .gz extension to track compressed files
        const compressedFilename = `${fileId}_compressed${extension}.gz`;
        const compressedPath = path.join(this.uploadDir, compressedFilename);
        fs.writeFileSync(compressedPath, dataToSave);
        
        // Store metadata about compression
        const metadata = {
          originalSize: file.buffer.length,
          compressedSize: dataToSave.length,
          compressionRatio: ((file.buffer.length - dataToSave.length) / file.buffer.length * 100).toFixed(1),
          originalFilename: file.originalname,
          compressed: true
        };
        
        fs.writeFileSync(compressedPath + '.meta', JSON.stringify(metadata, null, 2));
        console.log(`📦 Compressed ${file.originalname}: ${file.buffer.length} → ${dataToSave.length} bytes (${metadata.compressionRatio}% reduction)`);
        
        return compressedFilename;
      } catch (error) {
        console.error('Compression failed, storing uncompressed:', error);
        // Fall back to uncompressed storage
        fs.writeFileSync(filePath, file.buffer);
        return filename;
      }
    } else {
      // Store uncompressed
      fs.writeFileSync(filePath, dataToSave);
      return filename;
    }
  }

  async getFile(filename: string): Promise<Buffer | null> {
    const filePath = path.join(this.uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileData = fs.readFileSync(filePath);
    
    // Check if file is compressed (has .gz extension and metadata)
    if (filename.includes('_compressed') && filename.endsWith('.gz')) {
      try {
        const metadataPath = filePath + '.meta';
        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          console.log(`📦 Decompressing ${filename}: ${metadata.compressedSize} → ${metadata.originalSize} bytes`);
          return zlib.gunzipSync(fileData);
        }
      } catch (error) {
        console.error('Decompression failed:', error);
        return fileData; // Return compressed data as fallback
      }
    }
    
    return fileData;
  }

  async deleteFile(filename: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    
    return false;
  }

  async listFiles(): Promise<string[]> {
    if (!fs.existsSync(this.uploadDir)) {
      return [];
    }
    
    return fs.readdirSync(this.uploadDir);
  }
}

export const localStorage = new LocalFileStorage();