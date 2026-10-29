import { Module, Global } from '@nestjs/common';
import { R2StorageService } from './r2-storage.service';
import { SupabaseStorageService } from './supabase-storage.service';

@Global()
@Module({
  providers: [R2StorageService, SupabaseStorageService],
  exports: [R2StorageService, SupabaseStorageService],
})


export class StorageModule { }

