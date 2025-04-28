import { diskStorage } from 'multer';
import { join } from 'path';
import * as fs from 'fs';

const TMP_DIR = join(process.cwd(), 'tmp');

export const multerStorage = diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }
    cb(null, TMP_DIR);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  },
});
