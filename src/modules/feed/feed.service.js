import { User } from "../users/user.model.js";
import { Swipe } from "../swipes/swipe.model.js";

export const getFeed = async (currentUserId, filters) => {
  const { intent, skills, experienceLevel, page, limit } = filters;

  const pageNum = Number(page);
  const limitNum = Math.min(Number(limit), 50); // cap at 50 — never let client fetch unlimited
  const skip = (pageNum - 1) * limitNum;

  // Step 1: find everyone this user has already swiped (both like and pass)
  // These are excluded from the feed entirely
  const swipedDocs = await Swipe.find({ swiper: currentUserId }).select(
    "swiped",
  );
  const excludedIds = swipedDocs.map((s) => s.swiped);

  // Always exclude self too
  excludedIds.push(currentUserId);

  // Step 2: build filter query
  const query = {
    _id: { $nin: excludedIds }, // not in the excluded list
    isActive: true,
  };

  // Optional filters — only applied if the client sends them
  if (intent) {
    // $in: user must have this intent in their intent array
    query.intent = { $in: [intent] };
  }

  if (skills) {
    const skillsArray = skills.split(",").map((s) => s.trim().toLowerCase());
    // $in: user must have at least one matching skill
    query["profile.skills"] = { $in: skillsArray };
  }

  if (experienceLevel) {
    query["profile.experienceLevel"] = experienceLevel;
  }

  // Step 3: run query + count in parallel for pagination
  const [users, total] = await Promise.all([
    User.find(query)
      .select("profile intent createdAt") // public fields only — no email, no tokens
      .sort({ updatedAt: -1 }) // recently active users appear first
      .skip(skip)
      .limit(limitNum),

    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      hasMore: skip + users.length < total,
    },
  };
};
