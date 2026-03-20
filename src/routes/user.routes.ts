import express from "express";
import { addressController } from "../controllers/address.controller.js";
import { adminController } from "../controllers/admin.controller.js";
import { emergencyContactController } from "../controllers/emergency-contact.controller.js";
import { userController } from "../controllers/user.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";
import { createMulterUpload } from "../middlewares/upload.middleware.js";

const userRoutes = express.Router();

// ---------------- MULTER ----------------
const avatarUpload = createMulterUpload("avatars");
const documentUpload = createMulterUpload("documents");

// ---------------- AUTH ----------------
userRoutes.use(protect as any);

// ---------------- PROFILE ----------------
userRoutes.get("/profile", userController.getMyProfile);
userRoutes.patch("/profile", userController.updateMyProfile);

// ---------------- MEDICAL DATA ----------------
userRoutes.patch("/profile/medical-data", userController.updateMedicalData);

// ---------------- ADDRESSES ----------------
userRoutes.post("/profile/addresses", addressController.addAddress);
userRoutes.get("/profile/addresses", addressController.getAddresses);
userRoutes.patch("/profile/addresses/:addressId", addressController.updateAddress);
userRoutes.delete("/profile/addresses/:addressId", addressController.deleteAddress);

// ---------------- EMERGENCY CONTACTS ----------------
userRoutes.post("/profile/emergency-contacts", emergencyContactController.addEmergencyContact);
userRoutes.get("/profile/emergency-contacts", emergencyContactController.getEmergencyContacts);
userRoutes.patch(
    "/profile/emergency-contacts/:contactId",
    emergencyContactController.updateEmergencyContact,
);
userRoutes.delete(
    "/profile/emergency-contacts/:contactId",
    emergencyContactController.deleteEmergencyContact,
);

// ---------------- VERIFICATION DOCUMENTS ----------------
userRoutes.get("/profile/verification-documents", userController.getVerificationDocument);
userRoutes.post(
    "/profile/verification-documents",
    documentUpload.single("document"),
    userController.uploadVerificationDocument,
);

// ---------------- AVATAR ----------------
userRoutes.post(
    "/avatar",
    avatarUpload.single("avatar"),
    userController.uploadAvatar,
);
userRoutes.delete("/avatar", userController.deleteAvatar);

// ---------------- ACCOUNT ----------------
userRoutes.patch("/deactivate", userController.deactivateAccount);

// ---------------- PREFERENCES ----------------
userRoutes.get("/preferences", userController.getMyPreferences);
userRoutes.patch("/preferences", userController.updateMyPreferences);

// ================= ADMIN ROUTES =================
userRoutes.use("/admin", authorize("admin") as any);

// ---------------- USERS ----------------
userRoutes.get("/admin/users", adminController.getAllUsers);
userRoutes.get("/admin/users/:userId", adminController.getUserById);
userRoutes.patch("/admin/users/:userId", adminController.updateUser);
userRoutes.delete("/admin/users/:userId", adminController.deleteUser);
userRoutes.patch("/admin/users/:userId/reactivate", adminController.reactivateAccount);

// ---------------- ADMIN VERIFICATION ----------------
userRoutes.patch(
    "/admin/verification-documents/:userId/:documentId",
    adminController.approveVerificationDocument,
);

export default userRoutes;
