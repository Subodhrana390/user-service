import { Router } from "express";
import { internalController } from "../../controllers/internal.controller.js";

const router = Router();

router.post("/bulk", internalController.getUsersInternal);
router.get("/all", internalController.getAllUsers);
router.get("/:userId", internalController.getUserInternal);

export default router;
