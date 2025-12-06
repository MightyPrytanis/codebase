import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface LocalStorageFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  path: string;
}

export class LocalStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Buffer, originalName: string, mimeType: string): Promise<LocalStorageFile> {
    const id = crypto.randomUUID();
    const ext = path.extname(originalName);
    const filename = `${id}${ext}`;
    const filePath = path.join(this.uploadDir, filename);
    
    await fs.writeFile(filePath, file);
    
    const fileInfo: LocalStorageFile = {
      id,
      filename,
      originalName,
      size: file.length,
      mimeType,
      uploadedAt: new Date(),
      path: filePath
    };

    return fileInfo;
  }

  async getFile(fileId: string): Promise<Buffer | null> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const targetFile = files.find(f => f.startsWith(fileId));
      
      if (!targetFile) {
        return null;
      }

      const filePath = path.join(this.uploadDir, targetFile);
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const targetFile = files.find(f => f.startsWith(fileId));
      
      if (!targetFile) {
        return false;
      }

      const filePath = path.join(this.uploadDir, targetFile);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async listFiles(): Promise<LocalStorageFile[]> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const fileInfos: LocalStorageFile[] = [];
      
      for (const filename of files) {
        const filePath = path.join(this.uploadDir, filename);
        const stats = await fs.stat(filePath);
        const id = filename.split('.')[0];
        
        fileInfos.push({
          id,
          filename,
          originalName: filename,
          size: stats.size,
          mimeType: 'application/octet-stream', // Would need to be stored separately for accurate MIME types
          uploadedAt: stats.birthtime,
          path: filePath
        });
      }
      
      return fileInfos;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async getStorageStats(): Promise<{ usedBytes: number; fileCount: number }> {
    try {
      const files = await this.listFiles();
      const usedBytes = files.reduce((total, file) => total + file.size, 0);
      return {
        usedBytes,
        fileCount: files.length
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { usedBytes: 0, fileCount: 0 };
    }
  }
}

export const localStorageService = new LocalStorageService();