import { z } from "zod";

export const addressSchema = z.object({
    _id: z.string().optional(),
    type: z.enum(["home", "work", "billing", "shipping", "other"]).optional(),
    full_name: z.string().min(3).max(100),
    street: z.string().trim().min(1, "Street is required").optional(),
    city: z.string().trim().min(1, "City is required").optional(),
    state: z.string().trim().min(1, "State is required").optional(),
    postalCode: z.string().trim().min(1, "Postal code is required").optional(),
    country: z.string().optional().default("India"),
    phone: z
        .string()
        .trim()
        .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number")
        .optional(),

    location: z
        .object({
            type: z.literal("Point").default("Point"),
            coordinates: z.array(z.number()).length(2).optional(),
        })
        .optional(),

    isDefault: z.boolean().optional(),
});

export const emergencyContactSchema = z
    .object({
        name: z.string().trim().min(1).max(50).optional(),

        relationship: z.string().trim().max(30).optional(),

        mobile: z
            .string()
            .regex(/^\+?[1-9]\d{1,14}$/, "Invalid mobile number format")
            .optional(),

        email: z.string().email("Invalid email address").optional(),
    })
    .refine((data) => data.mobile || data.email, {
        message: "At least one contact method (mobile or email) is required",
        path: ["mobile"],
    });

export const verificationDocumentSchema = z.object({
    type: z.enum(["aadhar", "pan", "license", "passport"]),
    documentId: z.string().min(3),
});

export const updateMedicalDataSchema = z.object({
    bloodGroup: z
        .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
        .optional(),

    allergies: z.array(z.string().trim().min(1)).optional(),

    medicalConditions: z.array(z.string().trim().min(1)).optional(),
});

export const updateProfileSchema = z
    .object({
        name: z.string().trim().min(1).max(50).optional(),

        mobile: z
            .string()
            .regex(/^\+?[1-9]\d{1,14}$/, "Invalid mobile number format")
            .optional(),

        alternateEmail: z.string().email().optional(),

        dateOfBirth: z.coerce.date().optional(),

        gender: z.enum(["male", "female", "other"]).optional(),

        socialLinks: z
            .object({
                facebook: z.string().url().optional(),
                instagram: z.string().url().optional(),
            })
            .refine((val: any) => val.facebook || val.instagram, {
                message: "At least one social link is required",
            })
            .optional(),
    })
    .strict();

export const updatePreferencesSchema = z.object({
    emailNotifications: z.boolean().optional(),

    smsNotifications: z.boolean().optional(),

    language: z.enum(["en", "hi", "bn", "te", "mr", "ta", "gu"]).optional(),

    timezone: z.string().min(1).optional(),

    theme: z.enum(["light", "dark", "auto"]).optional(),

    locationSharing: z.boolean().optional(),

    profileVisibility: z.enum(["public", "private", "friends"]).optional(),

    marketingEmails: z.boolean().optional(),

    promotionalSMS: z.boolean().optional(),
});

export const getUsersSchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    cursor: z.string().optional(),
    search: z.string().optional(),
    role: z.enum(["user", "shop-owner", "admin", "rider"]).optional(),
    isActive: z
        .string()
        .transform((val) => val === "true")
        .optional(),
});

export const userIdSchema = z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
});

export const fileValidationSchema = z.object({
    mimetype: z.string().refine(
        (val) => ["application/pdf", "image/jpeg", "image/png"].includes(val),
        { message: "Only PDF, JPG, PNG files are allowed" }
    ),

    size: z.number().max(5 * 1024 * 1024, "File size must be under 5MB"),
});

export const addressIdParamSchema = z.object({
    addressId: z.string().min(1, "Address ID is required"),
});

export const reviewDocumentSchema = z.object({
    status: z.enum(["approved", "rejected"]),
    note: z.string().optional(),
});

export const updateAddressSchema = z
    .object({
        type: z.enum(["home", "work", "billing", "shipping", "other"]).optional(),
        full_name: z.string().min(3).max(100).optional(),
        street: z.string().trim().min(1, "Street cannot be empty").optional(),
        city: z.string().trim().min(1, "City cannot be empty").optional(),
        state: z.string().trim().min(1, "State cannot be empty").optional(),
        postalCode: z
            .string()
            .trim()
            .min(1, "Postal code cannot be empty")
            .optional(),
        country: z.string().optional(),

        phone: z
            .string()
            .trim()
            .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number")
            .optional(),

        location: z
            .object({
                type: z.literal("Point").default("Point"),
                coordinates: z.array(z.number()).length(2).optional(),
            })
            .optional(),

        isDefault: z.boolean().optional(),
    })
    .strict();

export const emergencyContactIdParamSchema = z.object({
    contactId: z.string().min(1, "Contact ID is required"),
});

export const updateEmergencyContactSchema = z
    .object({
        name: z.string().min(1).optional(),
        relationship: z.string().optional(),
        mobile: z
            .string()
            .regex(/^\+?[1-9]\d{1,14}$/, "Invalid mobile number")
            .optional(),
        email: z.string().email().optional(),
    })
    .refine(
        (data) => data.name || data.mobile || data.email || data.relationship,
        { message: "At least one field is required to update" },
    )
    .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactSchema>;
export type UpdateMedicalDataInput = z.infer<typeof updateMedicalDataSchema>;
