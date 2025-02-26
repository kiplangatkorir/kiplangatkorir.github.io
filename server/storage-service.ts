import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(err => {
  logger.error('Error creating uploads directory:', err);
});

export class StorageService {
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(originalName);
    return `${timestamp}-${randomString}${extension}`;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      const fileName = this.generateFileName(file.originalname);
      const filePath = path.join(UPLOAD_DIR, fileName);
      
      await fs.writeFile(filePath, file.buffer);
      
      // Return the URL path that can be used to access the file
      const fileUrl = `/uploads/${fileName}`;
      logger.info(`File uploaded successfully: ${fileName}`);
      return fileUrl;
    } catch (error) {
      logger.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(UPLOAD_DIR, fileName);
      await fs.unlink(filePath);
      logger.info(`File deleted successfully: ${fileName}`);
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }
}
