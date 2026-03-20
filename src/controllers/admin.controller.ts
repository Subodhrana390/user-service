import { Request, Response } from "express";
import { adminService } from "../services/admin.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../middlewares/async-handler.middleware.js";
import {
    getUsersSchema,
    reviewDocumentSchema,
    updateProfileSchema,
    userIdSchema,
} from "../validators/user.validator.js";

export class AdminController {
    getAllUsers = asyncHandler(async (req: Request, res: Response) => {
        const { limit = 20, cursor } = getUsersSchema.parse(req.query);
        const result = await adminService.getAllUsers(Math.min(limit as number, 50), cursor as string);
        return res.status(200).json(new ApiResponse(200, result, "Users fetched successfully"));
    });

    getUserById = asyncHandler(async (req: Request, res: Response) => {
        const { userId } = userIdSchema.parse(req.params);
        const result = await adminService.getUserById(userId);
        return res.status(200).json(new ApiResponse(200, result, "User profile fetched successfully"));
    });

    updateUser = asyncHandler(async (req: Request, res: Response) => {
        const { userId } = userIdSchema.parse(req.params);
        const updates = updateProfileSchema.parse(req.body);
        const profile = await adminService.updateUser(userId, updates);
        return res.status(200).json(new ApiResponse(200, profile, "User updated successfully"));
    });

    deleteUser = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const { userId } = userIdSchema.parse(req.params);
        const reason = (req.body as any)?.reason;
        await adminService.deleteUser(userId, req.user.id, reason);
        return res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
    });

    reactivateAccount = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const { userId } = userIdSchema.parse(req.params);
        const profile = await adminService.reactivateAccount(userId, req.user.id);
        return res.status(200).json(new ApiResponse(200, profile, "Account reactivated successfully"));
    });

    approveVerificationDocument = asyncHandler(async (req: Request, res: Response) => {
        const { userId } = userIdSchema.parse(req.params);
        const documentId = req.params.documentId as string;
        const { status, note } = reviewDocumentSchema.parse(req.body);

        const result = await adminService.reviewVerificationDocument(userId, documentId, status, note);
        return res.status(200).json(new ApiResponse(200, result, `Verification document ${status}`));
    });
}

export const adminController = new AdminController();
