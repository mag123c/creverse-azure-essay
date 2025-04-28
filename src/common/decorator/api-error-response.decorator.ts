import { applyDecorators } from '@nestjs/common';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponseDto } from '../response/api-response.dto';
import { JwtExpiredException, JwtUnauthorizedException, StudentNotFoundException } from '../exceptions/auth.exception';

const defaultErrorExample = {
  summary: '서버 오류',
  message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

const AuthErrorExamples = [
  { summary: '만료된 JWT 토큰', message: new JwtExpiredException().message },
  { summary: 'JWT 인증 실패', message: new JwtUnauthorizedException().message },
  { summary: '학생 정보를 찾을 수 없음', message: new StudentNotFoundException().message },
];

interface ErrorExample {
  summary: string;
  message: string;
}

/**
 * 기본 서버 오류 + 인증 오류 + 추가로 넘긴 예외들을 하나의 200 응답으로 등록
 */
export function ApiErrorResponses(...examples: ErrorExample[]) {
  const allExamples = [defaultErrorExample, ...AuthErrorExamples, ...examples];

  const examplesObject = allExamples.reduce(
    (acc, curr, index) => {
      acc[`ErrorExample${index + 1}`] = {
        summary: curr.summary,
        value: {
          result: 'failed',
          message: curr.message,
        },
      };
      return acc;
    },
    {} as Record<string, any>,
  );

  return applyDecorators(
    ApiResponse({
      status: 200,
      description: '오류 응답 예시',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          examples: examplesObject,
        },
      },
    }),
  );
}

export function ApiDefaultErrorResponse() {
  return ApiErrorResponses();
}
