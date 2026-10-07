import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

class StorageService {
  constructor() {
    this.s3Client = null;
  }

  isR2Configured() {
    const hasKeys =
      (process.env.R2_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY) &&
      (process.env.R2_SECRET_ACCESS_KEY || process.env.STORAGE_SECRET_KEY);
    const hasEndpointOrAccount =
      process.env.R2_ACCOUNT_ID || process.env.STORAGE_ENDPOINT;

    return Boolean(
      hasKeys &&
      hasEndpointOrAccount &&
      (process.env.STORAGE_PROVIDER === 'r2' || process.env.STORAGE_PROVIDER === 's3' || process.env.R2_BUCKET_NAME || process.env.STORAGE_BUCKET)
    );
  }

  getClient() {
    if (this.s3Client) return this.s3Client;

    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.STORAGE_SECRET_KEY;
    const accountId = process.env.R2_ACCOUNT_ID;
    const endpoint =
      process.env.STORAGE_ENDPOINT ||
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : null);

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Cloudflare R2 is missing required credentials: R2_ACCOUNT_ID (or STORAGE_ENDPOINT), R2_ACCESS_KEY_ID (or STORAGE_ACCESS_KEY), and R2_SECRET_ACCESS_KEY (or STORAGE_SECRET_KEY)'
      );
    }

    this.s3Client = new S3Client({
      region: process.env.STORAGE_REGION || 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return this.s3Client;
  }

  getBucketName() {
    return process.env.R2_BUCKET_NAME || process.env.STORAGE_BUCKET || 'jn-lms-documents';
  }

  /**
   * Upload a file either to Cloudflare R2 or to local storage
   * @param {Object} file - Multer file object
   * @returns {Promise<{ storageKey: string, storageUrl: string, isCloud: boolean, localPath: string }>}
   */
  async uploadFile(file) {
    if (!file) throw new Error('No file provided for upload');

    // If Cloudflare R2 is configured or provider is 'r2'
    if (this.isR2Configured() || process.env.STORAGE_PROVIDER === 'r2') {
      const client = this.getClient();
      const bucket = this.getBucketName();
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
      const objectKey = `documents/${baseName}-${uniqueSuffix}${ext}`;

      // Read file buffer from disk or memory
      const fileBuffer = file.buffer || (file.path ? await fs.promises.readFile(file.path) : null);
      if (!fileBuffer) {
        throw new Error('Unable to read uploaded file buffer');
      }

      console.log(`[StorageService] Uploading ${file.originalname} to Cloudflare R2 (Bucket: ${bucket}, Key: ${objectKey})...`);

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: file.mimetype,
      });

      await client.send(command);
      console.log(`[StorageService] Successfully uploaded ${objectKey} to Cloudflare R2`);

      // Determine public storage URL
      let storageUrl;
      if (process.env.R2_PUBLIC_URL) {
        storageUrl = `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${objectKey}`;
      } else {
        storageUrl = `https://${bucket}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${objectKey}`;
      }

      return {
        storageKey: objectKey,
        storageUrl,
        isCloud: true,
        localPath: file.path,
      };
    }

    // Default: Local disk fallback
    console.log(`[StorageService] Saving ${file.originalname} to local storage`);
    return {
      storageKey: file.path,
      storageUrl: `/uploads/documents/${file.filename}`,
      isCloud: false,
      localPath: file.path,
    };
  }

  /**
   * Delete a file from Cloudflare R2 or local disk
   * @param {string} storageKey
   */
  async deleteFile(storageKey) {
    if (!storageKey) return;

    // Check if key is in Cloudflare R2
    if ((this.isR2Configured() || process.env.STORAGE_PROVIDER === 'r2') && !fs.existsSync(storageKey)) {
      try {
        const client = this.getClient();
        const bucket = this.getBucketName();
        console.log(`[StorageService] Deleting ${storageKey} from Cloudflare R2...`);
        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: storageKey,
          })
        );
      } catch (err) {
        console.warn(`[StorageService] Failed to delete ${storageKey} from R2:`, err.message);
      }
    }

    // Check if local file exists and remove
    if (fs.existsSync(storageKey)) {
      try {
        await fs.promises.unlink(storageKey);
      } catch (err) {
        console.warn(`[StorageService] Could not unlink local file ${storageKey}:`, err.message);
      }
    }
  }

  /**
   * Get file as a Buffer (from local disk or R2)
   * @param {string} storageKey
   */
  async getFileBuffer(storageKey) {
    // If local file exists, read directly
    if (fs.existsSync(storageKey)) {
      return fs.promises.readFile(storageKey);
    }

    // Otherwise download from R2
    const client = this.getClient();
    const bucket = this.getBucketName();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    });

    const response = await client.send(command);
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}

export const storageService = new StorageService();
export default storageService;
