import { Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProfileScoringService } from './profile-scoring.service';
import { ProfileScoreResponseDto } from './dto/profile-score-response.dto';

@ApiTags('Profile Scoring')
@Controller('candidates/:candidateId/score')
export class ProfileScoringController {
  constructor(private readonly scoringService: ProfileScoringService) {}

  @Post()
  @ApiOperation({
    summary: 'Evaluate candidate profile and generate 100-point score',
    description:
      'Performs multi-dimensional evaluation across experience, skills, education, and impact, and returns recruiter-grade intelligence.',
  })
  @ApiParam({ name: 'candidateId', description: 'Candidate UUID identifier' })
  @ApiResponse({
    status: 200,
    description: 'Candidate profile score evaluated and persisted successfully',
    type: ProfileScoreResponseDto,
  })
  async calculateScore(
    @Param('candidateId') candidateId: string,
  ): Promise<ProfileScoreResponseDto> {
    return this.scoringService.scoreCandidate(candidateId);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve latest profile score for a candidate',
    description: 'Returns the existing score card or computes it automatically if not yet generated.',
  })
  @ApiParam({ name: 'candidateId', description: 'Candidate UUID identifier' })
  @ApiResponse({
    status: 200,
    description: 'Latest candidate profile score card',
    type: ProfileScoreResponseDto,
  })
  async getScore(
    @Param('candidateId') candidateId: string,
  ): Promise<ProfileScoreResponseDto> {
    return this.scoringService.getLatestScore(candidateId);
  }
}
