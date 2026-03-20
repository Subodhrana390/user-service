import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { IUserPreferences } from "../infra/kafka/interfaces/user-preferences.interface.js";

const userPreferencesSchema = new Schema<IUserPreferences>(
    {
        id: {
            type: String,
            default: uuidv4,
            unique: true,
            index: true,
        },
        userId: {
            type: String,
            index: true,
        },

        emailNotifications: {
            type: Boolean,
            default: true,
        },
        smsNotifications: {
            type: Boolean,
            default: false,
        },

        language: {
            type: String,
            enum: ["en", "hi", "bn", "te", "mr", "ta", "gu"],
            default: "en",
        },
        timezone: {
            type: String,
            default: "Asia/Kolkata",
        },

        theme: {
            type: String,
            enum: ["light", "dark", "auto"],
            default: "auto",
        },

        locationSharing: {
            type: Boolean,
            default: false,
        },

        profileVisibility: {
            type: String,
            enum: ["public", "private", "friends"],
            default: "public",
        },

        marketingEmails: {
            type: Boolean,
            default: false,
        },
        promotionalSMS: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: (_doc, ret) => {
                const { _id, ...rest } = ret;
                return rest;
            },
        },

        toObject: {
            virtuals: true,
            transform: (_doc, ret) => {
                const { _id, ...rest } = ret;
                return rest;
            },
        },
    },
);

const UserPreferences = mongoose.model<IUserPreferences>(
    "UserPreferences",
    userPreferencesSchema,
);

export default UserPreferences;
