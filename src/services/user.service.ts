import cloudinary from "../config/cloudinary.js";
import { EVENT_TYPES, KafkaManager } from "../infra/kafka/index.js";
import { config } from "../config/index.js";
import UserPreferences from "../models/user-preferences.model.js";
import UserProfile from "../models/user-profile.model.js";
import { ApiError } from "../utils/ApiError.js";
import { UpdateMedicalDataInput, UpdatePreferencesInput, UpdateProfileInput } from "../validators/user.validator.js";

export class UserService {
    async getProfile(userId: string) {
        const [profile, preferences] = await Promise.all([
            UserProfile.findOne({ userId }).lean(),
            UserPreferences.findOne({ userId }).lean(),
        ]);

        if (!profile) {
            throw new ApiError(404, "User profile not found");
        }

        const { _id: _p, ...profileData } = (profile as any) || {};
        const { _id: _pref, ...preferencesData } = (preferences as any) || {};

        return {
            profile: profileData,
            preferences: preferencesData,
        };
    }

    async updateProfile(userId: string, updates: UpdateProfileInput) {
        const existingProfile = await UserProfile.findOne({ userId });

        if (!existingProfile) {
            throw new ApiError(404, "User profile not found");
        }

        const $set: any = {};

        if (updates.name !== undefined) $set.name = updates.name;
        if (updates.mobile !== undefined) $set.mobile = updates.mobile;
        if (updates.alternateEmail !== undefined) $set.alternateEmail = updates.alternateEmail;

        if (updates.dateOfBirth !== undefined) {
            if (existingProfile.dateOfBirth) {
                throw new ApiError(400, "Date of birth can only be set once");
            }
            $set.dateOfBirth = updates.dateOfBirth;
        }

        if (updates.gender !== undefined) $set.gender = updates.gender;
        if (updates.socialLinks?.facebook !== undefined) $set["socialLinks.facebook"] = updates.socialLinks.facebook;
        if (updates.socialLinks?.instagram !== undefined) $set["socialLinks.instagram"] = updates.socialLinks.instagram;

        if (Object.keys($set).length === 0) {
            throw new ApiError(400, "No valid fields provided for update");
        }

        $set.lastProfileUpdate = new Date();

        const profile = await UserProfile.findOneAndUpdate(
            { userId },
            { $set },
            { new: true, runValidators: true }
        );

        return profile;
    }

    async getPreferences(userId: string) {
        const preferences = await UserPreferences.findOne({ userId }).lean();
        return (preferences as any) || {};
    }

    async updatePreferences(userId: string, updates: UpdatePreferencesInput) {
        const preferences = await UserPreferences.findOneAndUpdate(
            { userId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!preferences) {
            throw new ApiError(404, "User preferences not found");
        }

        return preferences;
    }

    async uploadVerificationDocument(userId: string, documentData: any, file: Express.Multer.File) {
        const document = {
            ...documentData,
            fileUrl: file.path,
            publicId: file.filename,
            status: "pending",
            uploadedAt: new Date(),
        };

        const profile = await UserProfile.findOneAndUpdate(
            { userId },
            {
                $push: { verificationDocuments: document },
                $set: { lastProfileUpdate: new Date() },
            },
            { new: true }
        );

        if (!profile) {
            throw new ApiError(404, "User profile not found");
        }

        return profile.verificationDocuments;
    }

    async updateAvatar(userId: string, url: string, publicId: string) {
        const profile = await UserProfile.findOne({ userId });
        
        if (profile?.avatarPublicId) {
            try {
                await cloudinary.uploader.destroy(profile.avatarPublicId);
            } catch (err) {
                console.error("Failed to delete old avatar from Cloudinary:", err);
            }
        }

        const updatedProfile = await UserProfile.findOneAndUpdate(
            { userId },
            { avatar: url, avatarPublicId: publicId, lastProfileUpdate: new Date() },
            { upsert: true, new: true }
        );

        return { avatarPath: url, profile: updatedProfile };
    }

    async deleteAvatar(userId: string) {
        const profile = await UserProfile.findOne({ userId });

        if (profile?.avatarPublicId) {
            try {
                await cloudinary.uploader.destroy(profile.avatarPublicId);
            } catch (err) {
                console.error("Failed to delete avatar from Cloudinary:", err);
            }

            profile.avatar = "";
            profile.avatarPublicId = "";
            profile.lastProfileUpdate = new Date();
            await profile.save();
        }
        return true;
    }

    async deactivateAccount(userId: string) {
        const profile = await UserProfile.findOneAndUpdate(
            { userId, isActive: true },
            { isActive: false, lastProfileUpdate: new Date() },
            { new: true }
        );

        if (!profile) {
            throw new ApiError(409, "Account is already deactivated");
        }

        await KafkaManager.publish({
            topic: config.kafka.topics.userEvents,
            eventType: EVENT_TYPES.USER_DEACTIVATED,
            payload: {
                userId: userId.toString(),
                changes: { isActive: false },
                updatedBy: userId.toString(),
            },
            metadata: { userId: userId.toString() },
        });

        return profile;
    }

    async updateMedicalData(userId: string, updates: UpdateMedicalDataInput) {
        const $set: any = {};
        if (updates.bloodGroup !== undefined) $set.bloodGroup = updates.bloodGroup;
        if (updates.allergies !== undefined) $set.allergies = updates.allergies;
        if (updates.medicalConditions !== undefined) $set.medicalConditions = updates.medicalConditions;

        if (Object.keys($set).length === 0) {
            throw new ApiError(400, "No valid medical data provided for update");
        }

        $set.lastProfileUpdate = new Date();

        const profile = await UserProfile.findOneAndUpdate(
            { userId },
            { $set },
            { new: true, runValidators: true }
        );

        if (!profile) {
            throw new ApiError(404, "User profile not found");
        }

        return profile;
    }

    async getVerificationDocuments(userId: string) {
        const profile = await UserProfile.findOne({ userId }).select("verificationDocuments");

        if (!profile) {
            throw new ApiError(404, "User profile not found");
        }

        return profile.verificationDocuments || [];
    }
}

export const userService = new UserService();
