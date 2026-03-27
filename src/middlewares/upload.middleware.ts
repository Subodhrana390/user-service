import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import { Request } from "express";

export const createMulterUpload = (folderName: string) => {
    const storage = new CloudinaryStorage({
        cloudinary: (cloudinary as any),
        params: async (req: Request, file: Express.Multer.File) => {
            const folderPath = `medicine-finder/users/${folderName}`;
            const fileExtension = file.mimetype.split("/")[1];
            const publicId = `${folderName}-${req.user?.id || "guest"}-${Date.now()}`;

            return {
                folder: folderPath,
                public_id: publicId,
                format: fileExtension,
            };
        },
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedTypes = /jpeg|jpg|png|webp|pdf/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(
            file.originalname.toLowerCase()
        );

        if (mimetype || extname) {
            return cb(null, true);
        }

        cb(new Error("Only JPG, PNG, WEBP images or PDF files are allowed"));
    };

    return multer({
        storage: storage as any,
        fileFilter,
        limits: {
            fileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880", 10),
        },
    });
};
