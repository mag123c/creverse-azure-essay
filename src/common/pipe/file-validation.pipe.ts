import { FileTypeValidator, ParseFilePipe, UploadedFile } from '@nestjs/common';

export function UploadedVideo(fileType: RegExp = /video\/mp4/) {
  return UploadedFile(
    new ParseFilePipe({
      validators: [
        new FileTypeValidator({
          fileType,
          skipMagicNumbersValidation: true,
          fallbackToMimetype: false,
        }),
      ],
      fileIsRequired: false,
    }),
  );
}
