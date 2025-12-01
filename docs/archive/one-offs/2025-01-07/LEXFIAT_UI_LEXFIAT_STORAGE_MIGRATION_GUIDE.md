---
Document ID: STORAGE-MIGRATION-GUIDE
Title: LexFiat Storage Migration Guide
Subject(s): LexFiat
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

The current implementation uses local filesystem storage that's:
- **Simple**: No external API dependencies or complex authentication
- **Reliable**: Direct filesystem access with standard Node.js fs operations
- **Configurable**: Environment variables control storage paths
- **Migration-Ready**: Clean abstraction layer for easy cloud migration

## How It Works

### File Structure
```
project-root/
├── public/
│   ├── uploads/           # User uploaded files (accessible via /public-objects/*)
│   └── assets/            # Static assets like logos, images
├── private/
│   └── uploads/           # Private files (server-side access only)
```

### User Perspective
1. **File Uploads**: Users upload files through the same API endpoints
2. **File Access**: Public files accessible via `/public-objects/filename` URLs
3. **Transparency**: No change in user experience - same URLs, same functionality

### Environment Configuration
```env
# Configure where files are stored
PUBLIC_OBJECT_SEARCH_PATHS=public/uploads,public/assets
PRIVATE_OBJECT_DIR=private/uploads
```

## Future Cloud Storage Migration

The ObjectStorageService class provides a clean interface that makes migrating to cloud storage straightforward:

### Option 1: AWS S3 Migration
```typescript
// Replace local filesystem methods with S3 SDK calls
async searchPublicObject(filePath: string): Promise<string | null> {
  // Instead of fs.access(), use s3.headObject()
  // Return S3 object URL or signed URL
}
```

### Option 2: Google Cloud Storage
```typescript
// Use Google Cloud Storage SDK
import { Storage } from '@google-cloud/storage';
// Implement same interface with GCS operations
```

### Option 3: Azure Blob Storage
```typescript
// Use Azure SDK
import { BlobServiceClient } from '@azure/storage-blob';
// Same interface, different backend
```

## Benefits of Current Approach

1. **Zero Vendor Lock-in**: Not tied to any specific cloud provider
2. **Simple Development**: Local files for development, easy to test
3. **Cost Effective**: No cloud storage costs during development
4. **Performance**: Direct filesystem access is faster than API calls
5. **Offline Capable**: Works without internet connection
6. **Easy Backup**: Standard filesystem backup tools work

## Migration Strategy

When ready to move to cloud storage:

1. **Interface Preservation**: Keep the same ObjectStorageService API
2. **Backend Swap**: Replace filesystem operations with cloud SDK calls
3. **Environment Variables**: Add cloud provider credentials
4. **Gradual Migration**: Can migrate different file types to different providers
5. **Hybrid Setup**: Use local for development, cloud for production

This approach ensures maximum flexibility while maintaining simplicity.