import { Swipe } from "./swipe.model.js";
import { Match } from "../matches/match.model.js";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/ApiError.js";

export const createSwipe = async (
  swiperId,
  { swipedId, direction, intent },
) => {
  // Guard 1: can't swipe yourself
  // toString() because swiperId is an ObjectId, swipedId is a string
  if (swiperId.toString() === swipedId) {
    throw new ApiError(400, "You cannot swipe yourself");
  }

  // Guard 2: swiped user must exist and be active
  const swipedUser = await User.findOne({ _id: swipedId, isActive: true });
  if (!swipedUser) throw new ApiError(404, "User not found");

  // Create the swipe.
  // We do NOT manually check for duplicates here.
  // The unique compound index { swiper, swiped } on the schema handles it.
  // A duplicate insert throws MongoDB error code 11000,
  // which the global errorHandler already converts to a 409 response.
  // Doing a findOne check before every insert would be an extra DB round trip
  // on every single swipe — unnecessary at this scale.
  const swipe = await Swipe.create({
    swiper: swiperId,
    swiped: swipedId,
    direction,
    intent,
  });

  // Match detection — only worth checking on a 'like'
  // A 'pass' can never create a match regardless
  let match = null;

  if (direction === "like") {
    const mutualLike = await Swipe.findOne({
      swiper: swipedId, // the other person swiped...
      swiped: swiperId, // ...on the current user
      direction: "like", // ...and they liked
    });

    if (mutualLike) {
      match = await Match.create({
        users: [swiperId, swipedId],
        intent,
      });
    }
  }

  return { swipe, match };
};

export const getMySwipes = async (userId, direction) => {
  const query = { swiper: userId };
  if (direction) query.direction = direction; // optional filter: ?direction=like

  const swipes = await Swipe.find(query)
    .populate("swiped", "profile intent") // attach basic profile of swiped user
    .sort({ createdAt: -1 });

  return swipes;
};
