// import mongoose, { isValidObjectId } from "mongoose";
// import { Video } from "../models/video.model.js";
// import { User } from "../models/user.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";

// import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //   const {
  //     page = 1,
  //     limit = 10,
  //     query = "",
  //     sortBy = "createdAt",
  //     sortType = "desc",
  //     userId,
  //   } = req.query;
  //   // Convert to numbers
  //   const pageNumber = parseInt(page);
  //   const limitNumber = parseInt(limit);
  //   const skip = (pageNumber - 1) * limitNumber;
  //   // Build filter object
  //   const filter = {};
  //   // 🔍 Search by title (case insensitive)
  //   if (query) {
  //     filter.title = { $regex: query, $options: "i" };
  //   }
  //   // 👤 Filter by user
  //   if (userId && mongoose.Types.ObjectId.isValid(userId)) {
  //     filter.owner = new mongoose.Types.ObjectId(userId);
  //   }
  //   // 🔄 Sorting
  //   const sortOrder = sortType === "asc" ? 1 : -1;
  //   const videos = await Video.find(filter)
  //     .sort({ [sortBy]: sortOrder })
  //     .skip(skip)
  //     .limit(limitNumber);
  //   const totalVideos = await Video.countDocuments(filter);
  //   res.status(200).json({
  //     success: true,
  //     page: pageNumber,
  //     limit: limitNumber,
  //     totalVideos,
  //     totalPages: Math.ceil(totalVideos / limitNumber),
  //     data: videos,
  //   });
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // 1. Validation
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Title and Description are required");
  }

  // 2. Get local paths from req.files
  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  // 3. Upload to Cloudinary
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "Video upload failed");
  }

  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail upload failed");
  }

  // 4. Create Video object in DB
  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videoFile.duration, // Cloudinary provides this for videos
    owner: req.user?._id, // Assuming you have auth middleware
    isPublished: true,
  });

  const createdVideo = await Video.findById(video._id);

  if (!createdVideo) {
    throw new ApiError(500, "Something went wrong while publishing the video");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  // 1. Get the local path of the new video from multer
  const videoFileLocalPath = req.file?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is missing");
  }

  // 2. Upload the new file to Cloudinary
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  if (!videoFile?.url) {
    throw new ApiError(400, "Error while uploading video to Cloudinary");
  }

  // 3. Update ONLY the videoFile URL in the database
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        videoFile: videoFile.url,
        // Optional: If you want to update duration as well since the file changed
        duration: videoFile.duration,
      },
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video URL updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
