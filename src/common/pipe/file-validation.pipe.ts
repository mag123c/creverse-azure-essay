import { FileTypeValidator, ParseFilePipe, UploadedFile } from '@nestjs/common';

export function UploadedVideo(fileType: RegExp = /\.mp4$/) {
  return UploadedFile(
    new ParseFilePipe({
      validators: [new FileTypeValidator({ fileType })],
      fileIsRequired: false,
    }),
  );
}
