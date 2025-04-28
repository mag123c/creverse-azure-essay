import { Body, Controller, Get, Param, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { SubmissionsService } from './service/submissions.service';
import {
  CreateSubmissionsRequestDto,
  CreateSubmissionsRequestWithFile,
  GetSubmissionsRequestDto,
} from './dto/submissions-request.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetSubmissionsResponseDto, SubmissionDetailResponseDto } from './dto/submissions-response.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadedVideo } from '@src/common/pipe/file-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { JwtDecoded } from '@src/common/decorator/jwt.decorator';
import { Student } from '../students/domain/student';
import { multerStorage } from '@src/infra/multer/multer.storage';

@ApiBearerAuth('accessToken')
@UseGuards(JwtAuthGuard)
@ApiTags('submissions')
@Controller('v1/submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @ApiOperation({ summary: '제출 결과 조회' })
  @Get()
  async getSubmissions(
    @JwtDecoded() student: Student,
    @Query() req: GetSubmissionsRequestDto,
  ): Promise<GetSubmissionsResponseDto> {
    return await this.submissionsService.getSubmissions(student, req);
  }

  @ApiOperation({ summary: '제출 결과 상세 조회' })
  @Get(':submissionId')
  async getSubmissionDetail(
    @JwtDecoded() student: Student,
    @Param('submissionId') submissionId: number,
  ): Promise<SubmissionDetailResponseDto> {
    return await this.submissionsService.getSubmissionDetail(student, submissionId);
  }

  @ApiOperation({
    summary: '에세이 제출 (AI 평가 요청)',
    description: `학생의 영어 에세이를 제출하여 AI 평가를 요청합니다.
  - 파일 업로드가 포함된 경우, 'multipart/form-data' 형식으로 요청되어야 하며 mp4 파일만 허용됩니다.
  - 파일이 없는 경우, 'application/json' 형식으로 요청할 수 있습니다.
  - 학생 1명당 동일한 컴포넌트 타입(componentType)은 1회만 제출 가능합니다. 이미 해당 타입으로 평가가 완료된 경우, 중복 제출은 허용되지 않습니다.`,
  })
  @ApiBody({ type: CreateSubmissionsRequestWithFile })
  @ApiConsumes('multipart/form-data')
  @ApiConsumes('application/json')
  @UseInterceptors(
    FileInterceptor('videoFile', {
      storage: multerStorage,
    }),
  )
  @Post()
  async generateSubmissionFeedback(
    @JwtDecoded() student: Student,
    @Body() req: CreateSubmissionsRequestDto,
    @UploadedVideo() videoFile?: Express.Multer.File,
  ): Promise<SubmissionDetailResponseDto> {
    return await this.submissionsService.generateSubmissionFeedback(student, req, videoFile);
  }
}
