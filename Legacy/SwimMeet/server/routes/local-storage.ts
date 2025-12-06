import { Router } from 'express';
import multer from 'multer';
import { localStorageService } from '../services/local-storage';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10
  }
});

// Upload files to local storage
router.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const uploadedFiles = [];
    
    for (const file of files) {
      const uploadedFile = await localStorageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      uploadedFiles.push(uploadedFile);
    }

    res.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Get file by ID
router.get('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileBuffer = await localStorageService.getFile(fileId);
    
    if (!fileBuffer) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Try to determine content type from file extension or default to octet-stream
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
});

// List all files
router.get('/files', async (req, res) => {
  try {
    const files = await localStorageService.listFiles();
    res.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Delete file by ID
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const success = await localStorageService.deleteFile(fileId);
    
    if (!success) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get storage statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await localStorageService.getStorageStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({ error: 'Failed to get storage stats' });
  }
});

export default router;