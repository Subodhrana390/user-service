import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler.middleware.js";
import { emergencyContactService } from "../services/emergency-contact.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  emergencyContactIdParamSchema,
  emergencyContactSchema,
  updateEmergencyContactSchema,
} from "../validators/user.validator.js";

export class EmergencyContactController {
  addEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new Error("Not authenticated");
    const contactData = emergencyContactSchema.parse(req.body);
    const result = await emergencyContactService.addContact(
      req.user.id,
      contactData,
    );
    return res
      .status(201)
      .json(
        new ApiResponse(201, result, "Emergency contact added successfully"),
      );
  });

  getEmergencyContacts = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new Error("Not authenticated");
    const contacts = await emergencyContactService.getContacts(req.user.id);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          contacts,
          "Emergency contacts fetched successfully",
        ),
      );
  });

  updateEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new Error("Not authenticated");
    const { contactId } = emergencyContactIdParamSchema.parse(req.params);
    const updates = updateEmergencyContactSchema.parse(req.body);
    const contacts = await emergencyContactService.updateContact(
      req.user.id,
      contactId,
      updates,
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          contacts,
          "Emergency contact updated successfully",
        ),
      );
  });

  deleteEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new Error("Not authenticated");
    const { contactId } = emergencyContactIdParamSchema.parse(req.params);
    const contacts = await emergencyContactService.deleteContact(req.user.id, contactId);
    return res
      .status(200)
      .json(
        new ApiResponse(200, contacts, "Emergency contact deleted successfully"),
      );
  });
}

export const emergencyContactController = new EmergencyContactController();
