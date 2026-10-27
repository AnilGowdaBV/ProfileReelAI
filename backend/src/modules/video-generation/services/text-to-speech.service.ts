import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';

export interface TTSResult {
  audioPath: string;
  durationSeconds: number;
}

@Injectable()
export class TextToSpeechService {
  private readonly logger = new Logger(TextToSpeechService.name);

  async generateSpeech(
    text: string,
    outputWavPath: string,
  ): Promise<TTSResult> {
    const dir = path.dirname(outputWavPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const timestamp = Date.now();
    const textFilePath = path.join(dir, `tts_text_${timestamp}.txt`);
    const psScriptPath = path.join(dir, `tts_synth_${timestamp}.ps1`);

    // Clean text: normalize dashes, spaces, and formatting
    const cleanedText = text
      .replace(/[–—]/g, '-')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 1. Write text cleanly to file with UTF-8 encoding
    fs.writeFileSync(textFilePath, cleanedText, 'utf8');

    // 2. PowerShell script that reads text from file as parameter (no escaping issues)
    const psScript = `
param($outputWav, $textFile)
try {
  Add-Type -AssemblyName System.Speech
  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $synth.Rate = 0
  $synth.Volume = 100
  $synth.SetOutputToWaveFile($outputWav)
  $text = [System.IO.File]::ReadAllText($textFile, [System.Text.Encoding]::UTF8)
  $synth.Speak($text)
  $synth.Dispose()
  exit 0
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
`;
    fs.writeFileSync(psScriptPath, psScript, 'utf8');

    try {
      if (process.platform === 'win32') {
        try {
          this.logger.log(`Synthesizing narration speech to: ${outputWavPath}`);
          cp.execSync(
            `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}" "${outputWavPath}" "${textFilePath}"`,
            { stdio: 'pipe', timeout: 15000 },
          );

          if (fs.existsSync(outputWavPath)) {
            const stats = fs.statSync(outputWavPath);
            if (stats.size > 1000) {
              const duration = Math.max(10, Math.round((stats.size - 44) / 44100));
              this.logger.log(`Audio narration synthesized successfully: ${stats.size} bytes (~${duration}s)`);
              return {
                audioPath: outputWavPath,
                durationSeconds: duration,
              };
            }
          }
        } catch (err: any) {
          const stderr = err.stderr ? err.stderr.toString() : err.message;
          this.logger.warn(`Windows speech synthesis warning: ${stderr}`);
        }
      }
    } finally {
      // Clean up temp scripts
      if (fs.existsSync(psScriptPath)) {
        try { fs.unlinkSync(psScriptPath); } catch {}
      }
      if (fs.existsSync(textFilePath)) {
        try { fs.unlinkSync(textFilePath); } catch {}
      }
    }

    // Fallback duration
    const wordCount = cleanedText.split(' ').length;
    const approxDuration = Math.max(10, Math.round(wordCount / 2.2));
    return {
      audioPath: outputWavPath,
      durationSeconds: approxDuration,
    };
  }
}
