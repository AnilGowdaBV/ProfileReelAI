import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import {
  CandidateResponseDto,
  CreateCandidateResponseDto,
} from './dto/candidate-response.dto';

@ApiTags('Candidates')
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit candidate LinkedIn URL for validation and profile retrieval',
  })
  @ApiBody({ type: CreateCandidateDto })
  @ApiResponse({
    status: 200,
    description: 'Candidate profile processed',
    type: CreateCandidateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or non-LinkedIn URL submitted',
  })
  async submitCandidate(
    @Body() dto: CreateCandidateDto,
  ): Promise<CreateCandidateResponseDto> {
    return this.candidatesService.submitCandidate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List recent candidate records' })
  @ApiResponse({
    status: 200,
    type: [CandidateResponseDto],
  })
  async listCandidates(): Promise<CandidateResponseDto[]> {
    return this.candidatesService.listCandidates();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get candidate details by ID with normalized facts',
  })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiResponse({
    status: 200,
    type: CandidateResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Candidate not found',
  })
  async getCandidate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CandidateResponseDto> {
    return this.candidatesService.getCandidateById(id);
  }

  @Patch(':id/profile-picture')
  @ApiOperation({ summary: 'Update candidate profile picture' })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  async updateProfilePicture(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { profilePictureUrl: string },
  ) {
    return this.candidatesService.updateProfilePicture(id, body.profilePictureUrl);
  }
}
