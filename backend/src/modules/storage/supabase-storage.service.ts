import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private supabase: SupabaseClient | null = null;
  private bucketName: string;

  constructor() {
    this.initClient();
  }

  public initClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY;

    this.bucketName =
      process.env.SUPABASE_RESUME_BUCKET || 'profile_rell.ai RESUMES';

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log(
        `Supabase Storage initialized for bucket: ${this.bucketName}`,
      );
    } else {
      this.logger.warn(
        'Supabase Storage pending credentials in environment (SUPABASE_URL and SUPABASE_KEY)',
      );
    }
  }

  async uploadResume(
    fileName: string,
    bufferOrBase64: Buffer | string,
    contentType: string = 'application/pdf',
  ): Promise<string | null> {
    if (!this.supabase) {
      this.initClient();
      if (!this.supabase) {
        this.logger.warn('Supabase client not initialized, skipping upload');
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
      const filePath = `resumes/${timestamp}_${sanitizedName}`;

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Supabase upload error: ${error.message}`);
        return null;
      }

      // Generate public URL
      const { data: publicData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl || '';
      this.logger.log(`Uploaded resume to Supabase Storage: ${publicUrl}`);
      return publicUrl;
    } catch (err: any) {
      this.logger.error(`Exception uploading to Supabase: ${err.message}`);
      return null;
    }
  }
}

