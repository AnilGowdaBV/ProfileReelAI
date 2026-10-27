import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/auth/entities/user.entity';
import { Candidate } from '../modules/candidates/entities/candidate.entity';
import { CandidateFact } from '../modules/candidates/entities/candidate-fact.entity';
import { GenerationJob } from '../modules/jobs/entities/generation-job.entity';
import { GeneratedVideo } from '../modules/video-generation/entities/generated-video.entity';
import { CandidateScore } from '../modules/profile-scoring/entities/candidate-score.entity';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  // Supabase / PostgreSQL Support
  if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: { rejectUnauthorized: false }, // Required for Supabase SSL connection
      entities: [User, Candidate, CandidateFact, GenerationJob, GeneratedVideo, CandidateScore],
      synchronize: true, // Auto-initializes schema on Supabase
      logging: process.env.DB_LOGGING === 'true',
    };
  }

  // MySQL (Local Development & MySQL Hosts)
  return {
    type: 'mysql',
    host: process.env.DB_HOST || process.env.MYSQL_HOST || process.env.MYSQLHOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || process.env.MYSQLPORT || '3306', 10),
    username: process.env.DB_USERNAME || process.env.MYSQL_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_DATABASE || process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'profilereel_ai',
    entities: [User, Candidate, CandidateFact, GenerationJob, GeneratedVideo, CandidateScore],
    synchronize: false, // Migrations manage MySQL schema
    logging: process.env.DB_LOGGING === 'true',
  };
};
