import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateMatchId } from "./match.validator.js";
import { listMatches, matchDetail, deleteMatch } from "./match.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listMatches);
router.get("/:matchId", validateMatchId, matchDetail);
router.delete("/:matchId", validateMatchId, deleteMatch);

export default router;
