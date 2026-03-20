import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Request } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createMulterUpload = (folderName: string) => {
    const uploadPath = path.join(__dirname, "../../uploads", folderName);

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination(req, file, cb) {
            cb(null, uploadPath);
        },

        filename(req: Request, file, cb) {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            const extension = path.extname(file.originalname).toLowerCase();

            cb(
                null,
                `${folderName}-${req.user?.id || "guest"}-${uniqueSuffix}${extension}`
            );
        },
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedTypes = /jpeg|jpg|png|webp|pdf/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );

        if (mimetype && extname) {
            return cb(null, true);
        }

        cb(new Error("Only JPG, PNG, WEBP images or PDF files are allowed"));
    };

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880", 10),
        },
    });
};
