import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ProfileReel AI API (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health should verify database connectivity and health', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.database.connected).toBe(true);
    expect(['mock', 'apify', 'pdl']).toContain(res.body.features.profileRetrievalProvider);
  });

  it('POST /api/candidates should reject invalid or non-LinkedIn domain', async () => {
    await request(app.getHttpServer())
      .post('/api/candidates')
      .send({ profileUrl: 'https://evil.com/in/scam' })
      .expect(400);
  });

  it('POST /api/candidates should process valid mock fixture profile', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/candidates')
      .send({
        profileUrl: 'https://www.linkedin.com/in/alex-chen-senior-fullstack',
      })
      .expect(200);

    expect(res.body).toHaveProperty('candidateId');
    expect(res.body).toHaveProperty('jobId');
    expect(res.body.retrievalStatus).toBe('SUCCESS');
    expect(res.body.displayName).toBe('Alex Chen');

    const candidateId = res.body.candidateId;
    const jobId = res.body.jobId;

    // Verify GET /api/candidates/:id
    const candidateRes = await request(app.getHttpServer())
      .get(`/api/candidates/${candidateId}`)
      .expect(200);

    expect(candidateRes.body.displayName).toBe('Alex Chen');
    expect(candidateRes.body.facts.length).toBeGreaterThan(0);

    // Verify GET /api/jobs/:id
    const jobRes = await request(app.getHttpServer())
      .get(`/api/jobs/${jobId}`)
      .expect(200);

    expect(jobRes.body.status).toBe('COMPLETED');
    expect(jobRes.body.currentStage).toBe('READY_FOR_SCRIPT');
  }, 30000);

  it('POST /api/candidates should return PROFILE_DATA_UNAVAILABLE for private profile', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/candidates')
      .send({
        profileUrl: 'https://www.linkedin.com/in/private-profile',
      })
      .expect(200);

    expect(res.body.retrievalStatus).toBe('PROFILE_DATA_UNAVAILABLE');
    expect(res.body.errorReason).toBeDefined();
  }, 30000);
});
