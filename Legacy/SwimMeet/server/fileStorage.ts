import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Standard file storage using local filesystem - 100% portable
export class StandardFileStorage {
  private uploadDir: string;
  
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // Generate a secure upload path
  generateUploadPath(originalName: string): string {
    const fileId = randomUUID();
    const ext = path.extname(originalName);
    const safeName = `${fileId}${ext}`;
    return path.join(this.uploadDir, safeName);
  }

  // Save uploaded file
  async saveFile(buffer: Buffer, originalName: string): Promise<{
    path: string;
    filename: string;
    size: number;
  }> {
    const filePath = this.generateUploadPath(originalName);
    await fs.promises.writeFile(filePath, buffer);
    
    return {
      path: filePath,
      filename: originalName,
      size: buffer.length
    };
  }

  // Get file for download
  async getFile(filePath: string): Promise<Buffer> {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    return fs.promises.readFile(filePath);
  }

  // Delete file
  async deleteFile(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  // Check if file exists
  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  // Get file info
  async getFileInfo(filePath: string): Promise<{
    size: number;
    created: Date;
    modified: Date;
  }> {
    const stats = await fs.promises.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }
}

export const fileStorage = new StandardFileStorage();