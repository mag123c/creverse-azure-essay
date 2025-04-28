import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { JwtDecoded } from '@src/common/decorator/jwt.decorator';
import { Student } from '../students/domain/student';
import { RevisionsService } from './service/revisions.service';
import { RevisionRequestDto } from './dto/revisions-request.dto';
import { ApiSuccessResponse } from '@src/common/response/api-response.dto';
import { ApiDefaultErrorResponse } from '@src/common/decorator/api-error-response.decorator';

@ApiBearerAuth('accessToken')
@UseGuards(JwtAuthGuard)
@ApiTags('revisions')
@Controller('v1/revisions')
export class RevisionsController {
  constructor(private readonly revisionsService: RevisionsService) {}

  //   @ApiOperation({ summary: '재평가 결과 리스트 조회' })
  //   @ApiResponse({ type: GetRevisionsResponseDto })
  //   @ApiDefaultErrorResponse()
  //   @Get()
  //   async getRevisions(
  //     @JwtDecoded() student: Student,
  //     @Query() req: GetRevisionsRequestDto,
  //   ): Promise<GetRevisionsResponseDto> {
  //     return await this.revisionsService.getRevisions(student, req);
  //   }

  //   @ApiOperation({ summary: '제평가 결과 상세 조회' })
  //   @ApiResponse({ type: RevisionDetailResponseDto })
  //   //   @ApiErrorResponses({ summary: '제출 내역을 찾을 수 없음', message: new SubmissionNotFoundException(1).message })
  //   @Get(':revisionId')
  //   async getRevisionDetail(
  //     @JwtDecoded() student: Student,
  //     @Param('revisionId') submissionId: number,
  //   ): Promise<RevisionDetailResponseDto> {
  //     return await this.revisionsService.getSubmissionDetail(student, submissionId);
  //   }

  @ApiOperation({
    summary: '재평가 요청',
    description: `평가된 에세이에 대해 재평가를 요청합니다.`,
  })
  @ApiDefaultErrorResponse()
  @Post()
  async revisionSubmission(
    @JwtDecoded() student: Student,
    @Body() req: RevisionRequestDto,
  ): Promise<ApiSuccessResponse<undefined>> {
    return await this.revisionsService.revisionSubmission(student, req.submissionId);
  }
}
