import { Document } from "mongoose";

export interface IUserPreferences extends Document {
    id: string;
    userId: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    language: "en" | "hi" | "bn" | "te" | "mr" | "ta" | "gu";
    timezone: string;
    theme: "light" | "dark" | "auto";
    locationSharing: boolean;
    profileVisibility: "public" | "private" | "friends";
    marketingEmails: boolean;
    promotionalSMS: boolean;
    createdAt: Date;
    updatedAt: Date;
}