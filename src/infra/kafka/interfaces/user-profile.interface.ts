import { Document } from "mongoose";

export interface IAddress {
  id: string;
  type: "home" | "work" | "billing" | "shipping" | "other";
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  isDefault: boolean;
}

export interface IEmergencyContact {
  id: string;
  name?: string;
  relationship?: string;
  mobile?: string;
  email?: string;
}

export interface IVerificationDocument {
  type: "aadhar" | "pan" | "license" | "passport";
  documentId: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: Date;
}

export interface IUserProfile extends Document {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  email: string;
  role: "user" | "shop-owner" | "admin" | "rider";
  isActive: boolean;
  isVerified: boolean;
  mobile?: string;
  alternateEmail?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  addresses: IAddress[];
  defaultAddressIndex: number;
  emergencyContacts: IEmergencyContact[];
  allergies: string[];
  medicalConditions: string[];
  socialLinks?: {
    facebook?: string;
    instagram?: string;
  };
  verificationDocuments: IVerificationDocument[];
  lastProfileUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}
