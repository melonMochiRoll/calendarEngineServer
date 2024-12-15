import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import fs from "fs";
import multer from "multer";

export const multerImageOptions: MulterOptions = {
  storage: multer.diskStorage({
    destination(req, file, cb) {

      if (!fs.existsSync(process.env.IMAGE_UPLOAD_LOCATION)) {
        fs.mkdirSync(process.env.IMAGE_UPLOAD_LOCATION);
      }

      cb(null, process.env.IMAGE_UPLOAD_LOCATION);
    },
    filename(req, file, cb) {
      cb(null, `${Date.now()}_${file.originalname}`);
    },
  }),
  limits: {
    fileSize: +process.env.MAX_IMAGE_SIZE * 1024 * 1024,
  },
};