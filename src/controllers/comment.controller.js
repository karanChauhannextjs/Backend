import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandlers.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  let { page = 1, limit = 10 } = req.query;

  // Validate videoId
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  // Convert to numbers
  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  // Get total count
  const totalComments = await Comment.countDocuments({ video: videoId });

  // Fetch paginated comments
  const comments = await Comment.find({ video: videoId })
    .select("-video -owner")
    .sort({ createdAt: -1 }) // latest first
    .skip(skip)
    .limit(limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        totalComments,
        totalPages: Math.ceil(totalComments / limit),
        currentPage: page,
      },
      "Comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  // 1. Validate if videoId is a valid MongoDB ObjectId
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  // 2. Validate content
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }

  // 3. Check if the video actually exists
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // 4. Create the comment
  // owner comes from req.user (attached by verifyJWT middleware)
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, "Something went wrong while saving the comment");
  }

  // 5. Return success response
  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  // Validate ObjectId
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID");
  }

  // Validate content
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }

  // Find comment
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // Optional: Check ownership (if you store user in comment)
  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this comment");
  }

  // Update comment
  comment.content = content.trim();
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  // Validate ObjectId
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID");
  }

  // Find comment
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // Optional: Only owner can delete
  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this comment");
  }

  // Delete comment
  await comment.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
