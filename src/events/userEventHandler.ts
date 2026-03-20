import { EVENT_TYPES } from "../infra/kafka/eventTypes.js";
import UserPreferences from "../models/user-preferences.model.js";
import UserProfile from "../models/user-profile.model.js";
import { IKafkaEvent } from "../infra/kafka/kafkaClient.js";

/**
 * Handle user-related events from Kafka with Idempotency and Validation
 */
export const handleUserEvents = async (event: IKafkaEvent, context: any) => {
    const { type, data } = event;

    if (!data?.userId) {
        console.error(`⚠️ Received event ${type} without userId. Skipping.`);
        return;
    }

    try {
        switch (type) {
            case EVENT_TYPES.USER_REGISTERED:
                await handleUserRegistered(data);
                break;

            case EVENT_TYPES.USER_DELETED:
                await handleUserDeleted(data);
                break;

            case EVENT_TYPES.USER_SHOP_OWNER_ROLE_GRANTED:
                await handleShopOwnerRoleGranted(data);
                break;
        }
    } catch (error: any) {
        console.error(`❌ Handler Error [${type}]:`, error.message);
        throw error; // allow retry / DLQ
    }
};

/**
 * Handle Shop Owner Role Granted: Update UserProfile role
 */
const handleShopOwnerRoleGranted = async (data: any) => {
    const { userId, role } = data;

    await UserProfile.findOneAndUpdate(
        { userId },
        { $set: { role: role } },
        { new: true }
    );

    console.log(`✅ User role updated to ${role}: ${userId}`);
};

/**
 * Handle user registration: initialize profile & preferences
 */
const handleUserRegistered = async (data: any) => {
    const { userId, email, name } = data;

    const defaultPreferences = {
        userId,
        emailNotifications: true,
        smsNotifications: false,
        language: "en",
        timezone: "Asia/Kolkata",
        theme: "auto",
        locationSharing: false,
        profileVisibility: "public",
        marketingEmails: false,
        promotionalSMS: false,
    };

    const defaultProfile = {
        userId,
        name: name || "",
        email: email || "",
        role: "user",
        isVerified: false,
        lastProfileUpdate: new Date(),
    };

    await Promise.all([
        UserPreferences.findOneAndUpdate({ userId }, defaultPreferences, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        }),
        UserProfile.findOneAndUpdate({ userId }, defaultProfile, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        }),
    ]);

    console.log(`✅ User defaults initialized: ${userId}`);
};

/**
 * Handle user deletion: cascade delete profile & preferences
 */
const handleUserDeleted = async (data: any) => {
    const { userId } = data;

    await Promise.all([
        UserPreferences.deleteOne({ userId }),
        UserProfile.deleteOne({ userId }),
    ]);

    console.log(`🗑️ User data purged: ${userId}`);
};
