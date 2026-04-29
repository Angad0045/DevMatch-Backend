import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateMatchId, validateMessageId } from "./chat.validator.js";
import { getMessages, deleteMessage } from "./chat.controller.js";

const router = Router();

router.use(authenticate);

router.get("/:matchId/messages", validateMatchId, getMessages);
router.delete("/messages/:messageId", validateMessageId, deleteMessage);

export default router;
