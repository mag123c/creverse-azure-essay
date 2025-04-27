import { join } from 'path';
import { promises as fs, readFileSync } from 'fs';
import { Readable } from 'stream';

export class VideoFileFixture {
  /**
   * 테스트용 비디오 파일을 video 디렉토리에서 tmp 디렉토리로 복사한 뒤
   * Multer.File 객체 형태로 반환합니다.
   */
  static async prepareTmpMulterFile(fileName = 'movie_1.mp4'): Promise<Express.Multer.File> {
    const root = process.cwd();
    const videoDir = join(root, 'test', 'fixture', 'video');
    const tmpDir = join(root, 'test', 'fixture', 'tmp');

    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });

    const srcPath = join(videoDir, fileName);
    const destPath = join(tmpDir, fileName);
    await fs.copyFile(srcPath, destPath);

    const buffer = readFileSync(destPath);

    // 올바르게 카피됐는지 확인
    const stats = await fs.stat(destPath);
    if (stats.size !== buffer.length) {
      throw new Error('File copy failed');
    }

    return {
      fieldname: 'videoFile',
      originalname: fileName,
      encoding: '7bit',
      mimetype: 'video/mp4',
      size: buffer.length,
      buffer,
      stream: Readable.from(buffer),
      destination: tmpDir,
      filename: fileName,
      path: destPath,
    };
  }

  static async fileExists(path: string): Promise<boolean> {
    return await fs
      .access(path)
      .then(() => true)
      .catch(() => false);
  }

  static async cleanupTmp(): Promise<void> {
    const tmpDir = join(__dirname, 'tmp');
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
