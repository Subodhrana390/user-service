import UserProfile from "../models/user-profile.model.js";
import { ApiError } from "../utils/ApiError.js";
import { UpdateAddressInput } from "../validators/user.validator.js";

export class AddressService {
    async addAddress(userId: string, addressData: any) {
        const profile = await UserProfile.findOne({ userId });

        if (!profile) {
            throw new ApiError(404, "User profile not found");
        }

        if (profile.addresses.length >= 5) {
            throw new ApiError(409, "Maximum 5 addresses allowed");
        }

        const isFirstAddress = profile.addresses.length === 0;

        profile.addresses.push({
            ...addressData,
            isDefault: isFirstAddress,
        } as any);

        profile.lastProfileUpdate = new Date();
        await profile.save();

        return profile.addresses;
    }

    async getAddresses(userId: string) {
        const profile = await UserProfile.findOne({ userId }, { addresses: 1 });

        if (!profile) {
            throw new ApiError(404, "User profile not found");
        }

        return profile.addresses;
    }

    async updateAddress(userId: string, addressId: string, updates: UpdateAddressInput) {
        if (updates.isDefault === true) {
            await UserProfile.updateOne(
                { userId },
                { $set: { "addresses.$[].isDefault": false } }
            );
        }

        const $set: any = {};
        for (const key in updates) {
            $set[`addresses.$.${key}`] = (updates as any)[key];
        }

        $set.lastProfileUpdate = new Date();

        const profile = await UserProfile.findOneAndUpdate(
            { userId, "addresses.id": addressId },
            { $set },
            { new: true }
        );

        if (!profile) {
            throw new ApiError(404, "Address not found");
        }

        return profile.addresses;
    }

    async deleteAddress(userId: string, addressId: string) {
        const profile = await UserProfile.findOne({ userId });

        if (!profile) {
            throw new ApiError(404, "User profile not found");
        }

        const addressToDelete = (profile.addresses as any).find((a: any) => a.id === addressId);

        if (!addressToDelete) {
            throw new ApiError(404, "Address not found");
        }

        const wasDefault = addressToDelete.isDefault;

        profile.addresses = profile.addresses.filter((a: any) => a.id !== addressId) as any;

        if (wasDefault && profile.addresses.length > 0) {
            (profile.addresses[0] as any).isDefault = true;
        }

        profile.lastProfileUpdate = new Date();
        await profile.save();

        return profile.addresses;
    }
}

export const addressService = new AddressService();
