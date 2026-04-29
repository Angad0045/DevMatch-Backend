import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateFeedQuery } from "./feed.validator.js";
import { feed } from "./feed.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", validateFeedQuery, feed);

export default router;
