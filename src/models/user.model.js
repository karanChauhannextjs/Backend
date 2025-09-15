import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowecase: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowecase: true,
      trim: true
    },
    fullName: {
      type: String,
      required: true,
      lowecase: true,
      trim: true,
      index: true
    },
    avatar: {
      tyoe: String,
      required: true
    },
    coverImages: {
      type: String
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video"
      }
    ],
    password: {
      type: String,
      required: [true, "Passqord is required"]
    },
    refreshToken: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model("User", userSchema);
