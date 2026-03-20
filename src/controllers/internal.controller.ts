import { Request, Response } from "express";
import UserProfile from "../models/user-profile.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../middlewares/async-handler.middleware.js";

export class InternalController {
    getUserInternal = asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.params;
        const user = await UserProfile.findOne({ userId }).select("+email name");

        if (!user) {
            return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

        return res.status(200).json(
            new ApiResponse(200, { user }, "User fetched successfully")
        );
    });

    getUsersInternal = asyncHandler(async (req: Request, res: Response) => {
        const { userIds } = req.body;

        const users = await UserProfile.find({
            userId: { $in: userIds },
        }).select("userId name email -_id");

        if (!users || users.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "Users not found"));
        }

        return res.status(200).json(
            new ApiResponse(200, { users }, "Users fetched successfully")
        );
    });

    getAllUsers = asyncHandler(async (req: Request, res: Response) => {
        const userProfiles = await UserProfile.find().lean();
        return res.status(200).json(new ApiResponse(200, userProfiles, "All users fetched successfully"));
    });
}

export const internalController = new InternalController();
