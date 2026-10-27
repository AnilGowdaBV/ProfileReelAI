import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../modules/auth/entities/user.entity';
import { Candidate } from '../modules/candidates/entities/candidate.entity';
import { CandidateFact } from '../modules/candidates/entities/candidate-fact.entity';
import { GenerationJob } from '../modules/jobs/entities/generation-job.entity';
import { GeneratedVideo } from '../modules/video-generation/entities/generated-video.entity';
import { CandidateScore } from '../modules/profile-scoring/entities/candidate-score.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'anil@2005',
  database: process.env.DB_DATABASE || 'profilereel_ai',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  entities: [User, Candidate, CandidateFact, GenerationJob, GeneratedVideo, CandidateScore],
  migrations: [path.join(__dirname, 'migrations', '*{.ts,.js}')],
});
