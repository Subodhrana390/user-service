import UserProfile from "../models/user-profile.model.js";
import UserPreferences from "../models/user-preferences.model.js";
import { ApiError } from "../utils/ApiError.js";
import { EVENT_TYPES, KafkaManager } from "../infra/kafka/index.js";
import { config } from "../config/index.js";

export class AdminService {
    async getAllUsers(limit: number, cursor?: string) {
        const query: any = {};

        if (cursor) {
            query._id = { $lt: cursor };
        }

        const users = await UserProfile.find(query)
            .select("userId email name role isActive isVerified lastProfileUpdate createdAt")
            .sort({ _id: -1 })
            .limit(limit + 1)
            .lean();

        const hasNextPage = users.length > limit;
        if (hasNextPage) users.pop();

        const nextCursor = hasNextPage ? users[users.length - 1]._id.toString() : null;

        return {
            users,
            pagination: {
                nextCursor,
                limit,
                hasNextPage,
            },
        };
    }

    async getUserById(userId: string) {
        const [profile, preferences] = await Promise.all([
            UserProfile.findOne({ userId }).lean(),
            UserPreferences.findOne({ userId }).lean(),
        ]);

        if (!profile) {
            throw new ApiError(404, "User not found");
        }

        const { _id: _p, ...profileData } = (profile as any) || {};
        const { _id: _pref, ...preferencesData } = (preferences as any) || {};

        return {
            profile: profileData,
            preferences: preferencesData,
        };
    }

    async updateUser(userId: string, updates: any) {
        updates.lastProfileUpdate = new Date();

        const profile = await UserProfile.findOneAndUpdate({ userId }, updates, {
            new: true,
            runValidators: true,
        });

        if (!profile) {
            throw new ApiError(404, "User not found");
        }

        return profile;
    }

    async deleteUser(userId: string, deletedBy: string, reason: string = "Manual deletion") {
        await Promise.all([
            UserProfile.findOneAndDelete({ userId }),
            UserPreferences.findOneAndDelete({ userId }),
        ]);

        await KafkaManager.publish({
            topic: config.kafka.topics.userEvents,
            eventType: EVENT_TYPES.USER_DELETED,
            payload: {
                userId: userId.toString(),
                deletedBy,
                reason,
            },
            metadata: { userId: userId.toString() },
        });

        return true;
    }

    async reactivateAccount(userId: string, updatedBy: string) {
        const profile = await UserProfile.findOneAndUpdate(
            { userId, isActive: false },
            { isActive: true, lastProfileUpdate: new Date() },
            { new: true }
        );

        if (!profile) {
            throw new ApiError(409, "Account is already active");
        }

        await KafkaManager.publish({
            topic: config.kafka.topics.userEvents,
            eventType: EVENT_TYPES.USER_REACTIVATED,
            payload: {
                userId: userId.toString(),
                changes: { isActive: true },
                updatedBy,
            },
            metadata: { userId: userId.toString() },
        });

        return profile;
    }

    async reviewVerificationDocument(userId: string, documentId: string, status: "approved" | "rejected", note?: string) {
        const profile = await UserProfile.findOne({ userId });

        if (!profile) {
            throw new ApiError(404, "User profile not found");
        }

        const document = (profile.verificationDocuments as any).find((d: any) => d._id?.toString() === documentId || d.id === documentId);

        if (!document) {
            throw new ApiError(404, "Verification document not found");
        }

        if (document.status === status) {
            throw new ApiError(409, `Document already ${status}`);
        }

        document.status = status;
        if (note) document.adminNote = note;

        if (status === "approved") {
            const allApproved = profile.verificationDocuments.every(
                (doc: any) => doc.status === "approved"
            );
            if (allApproved) profile.isVerified = true;
        } else if (status === "rejected") {
            profile.isVerified = false;
        }

        profile.lastProfileUpdate = new Date();
        await profile.save();

        return { document, isVerified: profile.isVerified };
    }
}

export const adminService = new AdminService();
