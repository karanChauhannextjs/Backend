import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userID) => {
  try {
    const user = await User.findById(userID);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    // console.log(accessToken, refreshToken, "weflkwmefklw;");
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error?.message);
    // console.log("FULL TOKEN ERROR 👉", error);
    throw error;
  }
};

const options = {
  httpOnly: true,
  secure: true,
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check is user already exists : username , email
  // check for images , check for avatar
  // upload them to cloudinary , avatar
  // create user  object - create an entry in DB
  // remove password and refresh token field from response
  // Check for user creation
  // return response

  const { username, email, fullName, password } = req.body;
  // console.log(req.body, "req.bodyreq.bodyreq.body");
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }

  const isExistedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (isExistedUser) {
    throw new ApiError(409, "User is already exist");
  }

  // if (req.files) {
  //   console.log(req.files?.avatar[0]?.path, "req.files");
  // }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (req.files?.coverImage) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    password,
    email,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User register successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body --> data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cookie
  console.log(req.body, "req.body");
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user?._id
  );

  const loggedInUser = await User.findById(user?._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        user: loggedInUser,
        accessToken,
        refreshToken,
      }),
      "User logged in successfully"
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req?.user?._id,
    {
      refreshToken: undefined,
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshAccessToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingAccessToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = await jwt.verify(
      req.cookies?.refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshAccessToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token Expired or used");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user?._id);

    return res
      .status(200)
      .cookies("accessToken", accessToken, options)
      .cookies("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            newRefreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
