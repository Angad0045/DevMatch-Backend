import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateUpdateProfile } from "./user.validator.js";
import {
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
} from "./user.controller.js";

const router = Router();

router.use(authenticate);

router.get("/me", getMyProfile);
router.patch("/me", validateUpdateProfile, updateMyProfile);
router.delete("/me", deleteMyAccount);

export default router;
