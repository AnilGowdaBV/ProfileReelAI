import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthCheckResult } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Application and database health check' })
  @ApiResponse({
    status: 200,
    description: 'Health status details (safe, no secrets exposed)',
  })
  async getHealth(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }
}
