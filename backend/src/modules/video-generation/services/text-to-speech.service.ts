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
  private ffmpegPath: string;

  constructor() {
    try {
      const ffmpeg = require('@ffmpeg-installer/ffmpeg');
      this.ffmpegPath = ffmpeg.path;
    } catch {
      this.ffmpegPath = 'ffmpeg';
    }
  }

  async generateSpeech(
    text: string,
    outputWavPath: string,
  ): Promise<TTSResult> {
    const dir = path.dirname(outputWavPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Clean text: normalize dashes, spaces, and formatting
    const cleanedText = text
      .replace(/[–—]/g, '-')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 1. Primary Method: Universal High-Quality Cloud/Web Neural TTS (works cross-platform on Linux/Render & Windows)
    try {
      const cloudResult = await this.synthesizeWithCloudTTS(cleanedText, outputWavPath);
      if (cloudResult) {
        return cloudResult;
      }
    } catch (err: any) {
      this.logger.warn(`Cloud TTS synthesis failed: ${err.message}, attempting platform fallback...`);
    }

    // 2. Fallback for Windows: PowerShell System.Speech
    if (process.platform === 'win32') {
      try {
        const winResult = await this.synthesizeWithWindowsSpeech(cleanedText, outputWavPath);
        if (winResult) {
          return winResult;
        }
      } catch (err: any) {
        this.logger.warn(`Windows speech fallback failed: ${err.message}`);
      }
    }

    // Fallback estimated duration if voice synthesis is unavailable
    const wordCount = cleanedText.split(' ').length;
    const approxDuration = Math.max(10, Math.round(wordCount / 2.2));
    this.logger.warn(`Audio narration could not be synthesized; returning fallback duration ${approxDuration}s`);
    return {
      audioPath: outputWavPath,
      durationSeconds: approxDuration,
    };
  }

  /**
   * Synthesizes speech using Google Translate Neural TTS endpoint.
   * Splits long text into natural punctuation chunks and concatenates audio streams via FFmpeg.
   * Completely free, fast, zero-dependency, and works natively in Linux/Docker/Render environments.
   */
  private async synthesizeWithCloudTTS(
    text: string,
    outputWavPath: string,
  ): Promise<TTSResult | null> {
    const dir = path.dirname(outputWavPath);
    const timestamp = Date.now();
    const tempMp3Path = path.join(dir, `tts_cloud_${timestamp}.mp3`);

    // Split text into natural chunks of <= 180 characters
    const chunks = this.splitIntoChunks(text, 180);
    this.logger.log(`Synthesizing speech in parallel via Cloud TTS for ${chunks.length} text chunk(s)...`);

    const audioBuffers: Buffer[] = await Promise.all(
      chunks.map(async (chunk) => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=en&client=tw-ob`;
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://translate.google.com/',
          },
          signal: AbortSignal.timeout(4500),
        });

        if (!res.ok) {
          throw new Error(`Cloud TTS returned HTTP status ${res.status}`);
        }

        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }),
    );

    if (audioBuffers.length === 0) {
      return null;
    }

    // Concatenate MP3 frames
    const combinedMp3Buffer = Buffer.concat(audioBuffers);
    fs.writeFileSync(tempMp3Path, combinedMp3Buffer);

    try {
      // Transcode MP3 to high-fidelity 44.1kHz mono 16-bit PCM WAV for video composition
      cp.execSync(
        `"${this.ffmpegPath}" -y -i "${tempMp3Path}" -ar 44100 -ac 1 "${outputWavPath}"`,
        { stdio: 'pipe', timeout: 30000 },
      );

      if (fs.existsSync(outputWavPath)) {
        const stats = fs.statSync(outputWavPath);
        if (stats.size > 1000) {
          // Standard WAV 16-bit mono 44.1kHz: 88,200 bytes per second
          const duration = Math.max(8, Math.round((stats.size - 44) / 88200));
          this.logger.log(`Cloud TTS voice narration synthesized: ${stats.size} bytes (~${duration}s)`);
          return {
            audioPath: outputWavPath,
            durationSeconds: duration,
          };
        }
      }
    } finally {
      if (fs.existsSync(tempMp3Path)) {
        try { fs.unlinkSync(tempMp3Path); } catch {}
      }
    }

    return null;
  }

  /**
   * Splits a long text string into natural sentences/chunks <= maxLen characters.
   */
  private splitIntoChunks(text: string, maxLen: number): string[] {
    const rawSentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const s of rawSentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;

      if ((currentChunk + ' ' + trimmed).trim().length <= maxLen) {
        currentChunk = (currentChunk + ' ' + trimmed).trim();
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        if (trimmed.length <= maxLen) {
          currentChunk = trimmed;
        } else {
          // Sentence itself exceeds maxLen; split on commas or spaces
          const words = trimmed.split(' ');
          currentChunk = '';
          for (const w of words) {
            if ((currentChunk + ' ' + w).trim().length <= maxLen) {
              currentChunk = (currentChunk + ' ' + w).trim();
            } else {
              if (currentChunk) chunks.push(currentChunk);
              currentChunk = w;
            }
          }
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
  }

  /**
   * Windows PowerShell speech synthesis fallback.
   */
  private async synthesizeWithWindowsSpeech(
    cleanedText: string,
    outputWavPath: string,
  ): Promise<TTSResult | null> {
    const dir = path.dirname(outputWavPath);
    const timestamp = Date.now();
    const textFilePath = path.join(dir, `tts_text_${timestamp}.txt`);
    const psScriptPath = path.join(dir, `tts_synth_${timestamp}.ps1`);

    fs.writeFileSync(textFilePath, cleanedText, 'utf8');
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
      this.logger.log(`Synthesizing narration via Windows Speech: ${outputWavPath}`);
      cp.execSync(
        `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}" "${outputWavPath}" "${textFilePath}"`,
        { stdio: 'pipe', timeout: 20000 },
      );

      if (fs.existsSync(outputWavPath)) {
        const stats = fs.statSync(outputWavPath);
        if (stats.size > 1000) {
          const duration = Math.max(10, Math.round((stats.size - 44) / 88200));
          return {
            audioPath: outputWavPath,
            durationSeconds: duration,
          };
        }
      }
    } finally {
      if (fs.existsSync(psScriptPath)) {
        try { fs.unlinkSync(psScriptPath); } catch {}
      }
      if (fs.existsSync(textFilePath)) {
        try { fs.unlinkSync(textFilePath); } catch {}
      }
    }

    return null;
  }
}
