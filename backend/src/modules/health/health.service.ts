import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  database: {
    connected: boolean;
    provider: string;
  };
  features: {
    profileRetrievalProvider: string;
    videoPipelineStage: string;
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check(): Promise<HealthCheckResult> {
    let dbConnected = false;
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        dbConnected = true;
      }
    } catch {
      dbConnected = false;
    }

    return {
      status: dbConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        connected: dbConnected,
        provider:
          this.dataSource.options.type === 'postgres'
            ? 'Supabase PostgreSQL'
            : 'MySQL 8.4',
      },
      features: {
        profileRetrievalProvider: process.env.PROFILE_DATA_PROVIDER || 'mock',
        videoPipelineStage: 'Phase 1 - Candidate Ingestion & Profile Retrieval',
      },
    };
  }
}
