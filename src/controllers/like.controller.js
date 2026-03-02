import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  let isLiked;

  if (existingLike) {
    // Unlike
    await existingLike.deleteOne();
    isLiked = false;
  } else {
    // Like
    await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    isLiked = true;
  }

  const totalLikes = await Like.countDocuments({ video: videoId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isLiked,
        totalLikes,
      },
      isLiked ? "Video liked" : "Video unliked"
    )
  );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  let isLiked;

  if (existingLike) {
    // Unlike
    await existingLike.deleteOne();
    isLiked = false;
  } else {
    // Like
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    isLiked = true;
  }

  const totalLikes = await Like.countDocuments({ comment: commentId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isLiked,
        totalLikes,
      },
      isLiked ? "Comment liked" : "Comment unliked"
    )
  );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  let isLiked;

  if (existingLike) {
    // Unlike
    await existingLike.deleteOne();
    isLiked = false;
  } else {
    // Like
    await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    isLiked = true;
  }

  const totalLikes = await Like.countDocuments({ tweet: tweetId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isLiked,
        totalLikes,
      },
      isLiked ? "Tweet liked" : "Tweet unliked"
    )
  );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $unwind: "$videoDetails",
    },
    {
      $project: {
        _id: "$videoDetails._id",
        title: "$videoDetails.title",
        description: "$videoDetails.description",
        thumbnail: "$videoDetails.thumbnail",
        views: "$videoDetails.views",
        createdAt: "$videoDetails.createdAt",
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  const totalLiked = await Like.countDocuments({
    likedBy: req.user._id,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        likedVideos,
        totalLiked,
        totalPages: Math.ceil(totalLiked / limit),
        currentPage: page,
      },
      "Liked videos fetched successfully"
    )
  );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
