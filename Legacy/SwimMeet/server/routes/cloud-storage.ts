// Cloud Storage API Routes - User-owned storage integration
import { Router } from 'express';
import { cloudStorageService } from '../services/cloud-storage';
import { requireAuth } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get available cloud providers
router.get('/providers', requireAuth, async (req, res) => {
  try {
    const providers = cloudStorageService.getProviders();
    res.json(providers);
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({ error: 'Failed to get providers' });
  }
});

// Get user's cloud connections
router.get('/connections', requireAuth, async (req, res) => {
  try {
    const connections = await cloudStorageService.getUserConnections(req.user.id);
    res.json(connections);
  } catch (error) {
    console.error('Error getting connections:', error);
    res.status(500).json({ error: 'Failed to get connections' });
  }
});

// Initiate OAuth authentication for a provider
router.post('/auth/:providerId', requireAuth, async (req, res) => {
  try {
    const { providerId } = req.params;
    const authUrl = await cloudStorageService.authenticate(providerId, req.user.id);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating auth:', error);
    res.status(500).json({ error: 'Failed to initiate authentication' });
  }
});

// Handle OAuth callback
router.get('/callback/:providerId', async (req, res) => {
  try {
    const { code, state } = req.query;
    const connection = await cloudStorageService.handleCallback(code as string, state as string);
    
    // Redirect to frontend with success
    res.redirect(`/?cloud_connected=${connection.providerId}`);
  } catch (error) {
    console.error('Error handling callback:', error);
    res.redirect('/?cloud_error=auth_failed');
  }
});

// Upload files to cloud storage
router.post('/upload', requireAuth, upload.array('files', 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    // Get user's preferred connection or fallback to local
    const connections = await cloudStorageService.getUserConnections(req.user.id);
    const settings = await cloudStorageService.getUserSettings(req.user.id);
    
    let connectionId: string;
    if (connections.length > 0 && settings?.preferredProvider !== 'local_filesystem') {
      const preferredConnection = connections.find(c => c.providerId === settings?.preferredProvider);
      connectionId = preferredConnection?.id || connections[0].id;
    } else {
      // Use local filesystem as fallback
      connectionId = 'local';
    }

    const uploadedFiles = [];
    for (const file of files) {
      const cloudFile = await cloudStorageService.upload(
        file.buffer,
        file.originalname,
        connectionId,
        req.user.id
      );
      uploadedFiles.push({
        id: cloudFile.id,
        name: cloudFile.originalName,
        size: cloudFile.size,
        path: `/api/cloud/download/${cloudFile.id}`
      });
    }

    res.json({ files: uploadedFiles });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Download file from cloud storage
router.get('/download/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = await cloudStorageService.getFileInfo(fileId);
    const fileBuffer = await cloudStorageService.download(fileId);

    res.set({
      'Content-Type': fileInfo.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileInfo.originalName}"`,
      'Content-Length': fileBuffer.length.toString(),
    });

    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// Delete file from cloud storage
router.delete('/files/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    await cloudStorageService.delete(fileId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get user's cloud storage settings
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const settings = await cloudStorageService.getUserSettings(req.user.id);
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update user's cloud storage settings
router.put('/settings', requireAuth, async (req, res) => {
  try {
    await cloudStorageService.updateUserSettings(req.user.id, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get quota information for a connection
router.get('/quota/:connectionId', requireAuth, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const quota = await cloudStorageService.getQuota(connectionId);
    res.json(quota);
  } catch (error) {
    console.error('Error getting quota:', error);
    res.status(500).json({ error: 'Failed to get quota information' });
  }
});

export { router as cloudStorageRouter };