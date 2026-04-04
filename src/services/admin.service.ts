import UserProfile from "../models/user-profile.model.js";
import UserPreferences from "../models/user-preferences.model.js";
import { ApiError } from "../utils/ApiError.js";
import { EVENT_TYPES, KafkaManager } from "../infra/kafka/index.js";
import { config } from "../config/index.js";

export class AdminService {
    async getAllUsers(limit: number, before?: string, after?: string) {
        const query: any = {};
        let sortDirection: 1 | -1 = -1;

        const activeCursor = after || before;

        if (activeCursor) {
            const [timeStr, id] = activeCursor.split('|');
            const date = new Date(timeStr);
            const operator = after ? '$lt' : '$gt';
            sortDirection = after ? -1 : 1;

            query.$or = [
                { createdAt: { [operator]: date } },
                {
                    createdAt: date,
                    id: { [after ? '$lt' : '$gt']: id }
                }
            ];
        }

        let users = await UserProfile.find(query)
            .select("id email name role userId isActive isVerified lastProfileUpdate createdAt")
            .sort({ createdAt: sortDirection, id: sortDirection })
            .limit(limit + 1)
            .lean();

        if (before) {
            users.reverse();
        }

        const hasMore = users.length > limit;
        if (hasMore) {
            if (before) users.shift();
            else users.pop();
        }

        const createCursor = (user: any) =>
            user ? `${user.createdAt.toISOString()}|${user.id}` : null;

        return {
            users,
            pagination: {
                prevCursor: users.length > 0 ? createCursor(users[0]) : null,
                nextCursor: users.length > 0 ? createCursor(users[users.length - 1]) : null,
                hasPrevious: !!before || (after && hasMore),
                hasNext: !!after || (!before && hasMore)
            }
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

    async updateRole(userId: string, role: string) {
        const profile = await UserProfile.findOneAndUpdate({ userId }, { role }, {
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

    async updateStatus(userId: string, status: string, updatedBy: string) {
        const profile = await UserProfile.findOneAndUpdate(
            { userId },
            { isActive: status, lastProfileUpdate: new Date() },
            { new: true }
        );

        if (!profile) {
            throw new ApiError(404, "User does not exist");
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
    async verifyUser(userId: string, status: string, updatedBy: string) {
        const profile = await UserProfile.findOneAndUpdate(
            { userId },
            { isVerified: status, lastProfileUpdate: new Date() },
            { new: true }
        );

        if (!profile) {
            throw new ApiError(404, "User does not exist");
        }

        await KafkaManager.publish({
            topic: config.kafka.topics.userEvents,
            eventType: EVENT_TYPES.USER_REACTIVATED,
            payload: {
                userId: userId.toString(),
                changes: { isVerified: status },
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

        const document = (profile.verificationDocuments as any).find((d: any) => d.id === documentId);

        if (!document) {
            throw new ApiError(404, "Verification document not found");
        }

        if (document.status === status) {
            throw new ApiError(409, `Document already ${status}`);
        }

        document.status = status;
        if (note) document.adminNote = note;

        profile.lastProfileUpdate = new Date();
        await profile.save();

        return { document, isVerified: profile.isVerified };
    }
}

export const adminService = new AdminService();
