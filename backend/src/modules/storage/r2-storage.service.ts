import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicBaseUrl: string;

  constructor() {
    this.initClient();
  }

  public initClient() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME || 'profilereel-resumes';
    this.publicBaseUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

    if (accountId && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log(`Cloudflare R2 Storage initialized for bucket: ${this.bucketName}`);
    } else {
      this.logger.warn('Cloudflare R2 credentials pending in .env');
    }
  }

  async uploadResume(
    fileName: string,
    bufferOrBase64: Buffer | string,
    contentType: string = 'application/pdf',
  ): Promise<string | null> {
    if (!this.s3Client) {
      this.initClient();
      if (!this.s3Client) {
        return null;
      }
    }

    try {
      let fileBuffer: Buffer;
      if (typeof bufferOrBase64 === 'string') {
        const cleanBase64 = bufferOrBase64.replace(/^data:.*?;base64,/, '');
        fileBuffer = Buffer.from(cleanBase64, 'base64');
      } else {
        fileBuffer = bufferOrBase64;
      }

      const timestamp = Date.now();
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9\._-]/g, '_');
      const key = `resumes/${timestamp}_${sanitizedName}`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        }),
      );

      const publicUrl = this.publicBaseUrl ? `${this.publicBaseUrl}/${key}` : `https://${this.bucketName}.r2.dev/${key}`;
      this.logger.log(`Uploaded resume to Cloudflare R2: ${publicUrl}`);
      return publicUrl;
    } catch (err: any) {
      this.logger.error(`Failed to upload to Cloudflare R2: ${err.message}`);
      return null;
    }
  }
}
