import { Module } from '@nestjs/common';
import { ScriptGenerationService } from './script-generation.service';

@Module({
  providers: [ScriptGenerationService],
  exports: [ScriptGenerationService],
})
export class ScriptGenerationModule {}
