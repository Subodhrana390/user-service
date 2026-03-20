import { Request, Response } from "express";
import { addressService } from "../services/address.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../middlewares/async-handler.middleware.js";
import {
    addressIdParamSchema,
    addressSchema,
    updateAddressSchema,
} from "../validators/user.validator.js";

export class AddressController {
    addAddress = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const addressData = addressSchema.parse(req.body);
        const result = await addressService.addAddress(req.user.id, addressData);
        return res.status(201).json(new ApiResponse(201, result, "Address added successfully"));
    });

    getAddresses = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const addresses = await addressService.getAddresses(req.user.id);
        return res.status(200).json(new ApiResponse(200, addresses, "Addresses fetched successfully"));
    });

    updateAddress = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const { addressId } = addressIdParamSchema.parse(req.params);
        const updates = updateAddressSchema.parse(req.body);
        const addresses = await addressService.updateAddress(req.user.id, addressId, updates);
        return res.status(200).json(new ApiResponse(200, addresses, "Address updated successfully"));
    });

    deleteAddress = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const { addressId } = addressIdParamSchema.parse(req.params);
        const addresses = await addressService.deleteAddress(req.user.id, addressId);
        return res.status(200).json(new ApiResponse(200, addresses, "Address deleted successfully"));
    });
}

export const addressController = new AddressController();
