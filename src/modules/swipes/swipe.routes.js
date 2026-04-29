import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateSwipe } from "./swipe.validator.js";
import { swipe, mySwipes } from "./swipe.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", validateSwipe, swipe);
router.get("/", mySwipes); // GET /api/v1/swipes?direction=like

export default router;
