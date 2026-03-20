import { Request, Response } from "express";
import { userService } from "../services/user.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../middlewares/async-handler.middleware.js";
import {
    fileValidationSchema,
    updateMedicalDataSchema,
    updatePreferencesSchema,
    updateProfileSchema,
    verificationDocumentSchema,
} from "../validators/user.validator.js";

export class UserController {
    getMyProfile = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const data = await userService.getProfile(req.user.id);
        return res.status(200).json(new ApiResponse(200, data, "Profile fetched successfully"));
    });

    updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const updates = updateProfileSchema.parse(req.body);
        const profile = await userService.updateProfile(req.user.id, updates);
        return res.status(200).json(new ApiResponse(200, profile, "Profile updated successfully"));
    });

    getMyPreferences = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const preferences = await userService.getPreferences(req.user.id);
        return res.status(200).json(new ApiResponse(200, preferences, "Preferences fetched successfully"));
    });

    updateMyPreferences = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const updates = updatePreferencesSchema.parse(req.body);
        const preferences = await userService.updatePreferences(req.user.id, updates);
        return res.status(200).json(new ApiResponse(200, preferences, "Preferences updated successfully"));
    });

    uploadVerificationDocument = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const documentData = verificationDocumentSchema.parse(req.body);

        if (!req.file) {
            return res.status(400).json(new ApiResponse(400, null, "Verification document file is required"));
        }

        fileValidationSchema.parse({
            mimetype: req.file.mimetype,
            size: req.file.size,
        });

        const document = await userService.uploadVerificationDocument(req.user.id, documentData, req.file);
        return res.status(201).json(new ApiResponse(201, document, "Verification document uploaded successfully"));
    });

    uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        if (!req.file) {
            return res.status(400).json(new ApiResponse(400, null, "No file uploaded"));
        }

        const { avatarPath, profile } = await userService.updateAvatar(req.user.id, req.file.filename);
        return res.status(200).json(new ApiResponse(200, { avatar: avatarPath, profile }, "Avatar uploaded successfully"));
    });

    deleteAvatar = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        await userService.deleteAvatar(req.user.id);
        return res.status(200).json(new ApiResponse(200, null, "Avatar removed successfully"));
    });

    deactivateAccount = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const profile = await userService.deactivateAccount(req.user.id);
        return res.status(200).json(new ApiResponse(200, profile, "Account deactivated successfully"));
    });

    updateMedicalData = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const updates = updateMedicalDataSchema.parse(req.body);
        const profile = await userService.updateMedicalData(req.user.id, updates);
        return res.status(200).json(new ApiResponse(200, profile, "Medical data updated successfully"));
    });

    getVerificationDocument = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const documents = await userService.getVerificationDocuments(req.user.id);
        return res.status(200).json(new ApiResponse(200, documents, "Verification documents fetched successfully"));
    });
}

export const userController = new UserController();
