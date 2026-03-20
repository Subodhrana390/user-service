import UserProfile from "../models/user-profile.model.js";
import { ApiError } from "../utils/ApiError.js";
import { UpdateEmergencyContactInput } from "../validators/user.validator.js";

export class EmergencyContactService {
  async addContact(userId: string, contactData: any) {
    const profile = await UserProfile.findOneAndUpdate(
      {
        userId,
        $expr: {
          $lt: [{ $size: "$emergencyContacts" }, 5],
        },
      },
      {
        $push: {
          emergencyContacts: contactData,
        } as any,
        $set: { lastProfileUpdate: new Date() },
      },
      { new: true },
    );

    if (!profile) {
      throw new ApiError(
        409,
        "Maximum 5 emergency contacts allowed or profile not found",
      );
    }

    return profile.emergencyContacts;
  }

  async getContacts(userId: string) {
    const profile = await UserProfile.findOne(
      { userId },
      { emergencyContacts: 1 },
    );

    if (!profile) {
      throw new ApiError(404, "User profile not found");
    }

    return profile.emergencyContacts;
  }

  async updateContact(
    userId: string,
    contactId: string,
    updates: UpdateEmergencyContactInput,
  ) {
    const $set: any = {};
    for (const key in updates) {
      $set[`emergencyContacts.$.${key}`] = (updates as any)[key];
    }

    $set.lastProfileUpdate = new Date();

    const profile = await UserProfile.findOneAndUpdate(
      { userId, "emergencyContacts.id": contactId },
      { $set },
      { new: true },
    );

    if (!profile) {
      throw new ApiError(404, "Emergency contact not found");
    }

    return profile.emergencyContacts;
  }

  async deleteContact(userId: string, contactId: string) {
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $pull: { emergencyContacts: { id: contactId } } as any,
        $set: { lastProfileUpdate: new Date() },
      },
      { new: true },
    );

    if (!profile) {
      throw new ApiError(404, "Emergency contact not found");
    }

    return profile.emergencyContacts;
  }
}

export const emergencyContactService = new EmergencyContactService();
