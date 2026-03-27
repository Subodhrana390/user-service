import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import {
  IAddress,
  IEmergencyContact,
  IUserProfile,
} from "../infra/kafka/interfaces/user-profile.interface.js";

const addressSchema = new Schema<IAddress>(
  {
    id: {
      type: String,
      default: uuidv4,
    },
    type: {
      type: String,
      enum: ["home", "work", "billing", "shipping", "other"],
      default: "home",
      required: true,
    },

    street: { type: String, trim: true, required: true },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    postalCode: { type: String, trim: true, required: true },
    country: { type: String, trim: true, default: "India" },
    phone: {
      type: String,
      trim: true,
      required: true,
      match: [
        /^[6-9]\d{9}$/,
        "Please enter a valid 10-digit Indian mobile number",
      ],
    },

    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    id: {
      type: String,
      default: uuidv4,
    },
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  {
    _id: true,
  },
);

const userProfileSchema = new Schema<IUserProfile>(
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

    name: { type: String, trim: true, default: "" },
    avatar: { type: String, default: "" },
    avatarPublicId: { type: String, default: "" },
    email: { type: String, trim: true, default: "", immutable: true },

    role: {
      type: String,
      enum: ["user", "shop-owner", "admin", "rider"],
      default: "user",
    },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    mobile: { type: String, trim: true, unique: true, sparse: true },
    alternateEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email format",
      },
    },

    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    addresses: [addressSchema],
    defaultAddressIndex: { type: Number, default: 0 },

    emergencyContacts: [emergencyContactSchema],

    allergies: [{ type: String, trim: true }],
    medicalConditions: [{ type: String, trim: true }],

    socialLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
    },

    verificationDocuments: [
      {
        type: {
          type: String,
          enum: ["aadhar", "pan", "license", "passport"],
          required: true,
        },
        documentId: { type: String, required: true },
        fileUrl: { type: String, required: true },
        publicId: { type: String, default: "" },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    lastProfileUpdate: { type: Date, default: Date.now },
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

userProfileSchema.index({ createdAt: -1 });

userProfileSchema.pre("save", function (next) {
  this.lastProfileUpdate = new Date();
  next();
});

const UserProfile = mongoose.model<IUserProfile>(
  "UserProfile",
  userProfileSchema,
);
export default UserProfile;
