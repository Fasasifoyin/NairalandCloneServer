import generateToken from "../config/generateToken.js";
import User from "../models/User.js";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";

import * as dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const Signup = expressAsyncHandler(async (req, res) => {
  const { firstName, lastName, userName, email, password } = req.body;

  const existUserName = await User.findOne({ userName });
  if (existUserName) {
    return res.status(400).json({ message: "Username already in use" });
  }

  const existEmail = await User.findOne({ email });
  if (existEmail) {
    return res.status(400).json({ message: "E-mail already in use" });
  }

  let newUser = await User.create({
    firstName,
    lastName,
    userName,
    email,
    password,
  });

  res.status(201).json({
    _id: newUser._id,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    userName: newUser.userName,
    email: newUser.email,
    image: newUser.image,
    isAdmin: newUser.isAdmin,
    token: generateToken(newUser),
  });
});

export const Signin = expressAsyncHandler(async (req, res) => {
  const { userName, password } = req.body;

  const existUser = await User.findOne({ userName });
  if (!existUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const matchPassword = await existUser.matchPassword(password);
  if (!matchPassword) {
    return res.status(400).json({ message: "Password is not correct" });
  }

  res.status(200).json({
    _id: existUser._id,
    firstName: existUser.firstName,
    lastName: existUser.lastName,
    userName: existUser.userName,
    email: existUser.email,
    image: existUser.image,
    isAdmin: existUser.isAdmin,
    token: generateToken(existUser),
  });
});

export const getUserDetails = expressAsyncHandler(async (req, res) => {
  const { userName } = req.params;

  const getUser = await User.findOne({ userName }).populate("allBlogs");

  if (!getUser) {
    return res
      .status(404)
      .json({ message: `${userName} does not seem to be a valid user` });
  }

  res.status(200).json(getUser);
});

export const updatePhoto = expressAsyncHandler(async (req, res) => {
  const userId = req.userId;
  const { userName, file } = req.body;

  const userExists = await User.findOne({ userName });

  if (!userExists) {
    return res.status(404).json({ message: "User not found" });
  }

  if (String(userExists._id) !== String(userId)) {
    return res
      .status(400)
      .json({ message: "You cannot edit someone else's profile" });
  }

  if (!file) {
    const updatedProfile = await User.findOneAndUpdate(
      { userName },
      {
        image:
          "https://res.cloudinary.com/dbxvk3apv/image/upload/v1690553303/Nairaland/default_avatar_cxfqgl.jpg",
      },
      { new: true }
    );

    return res.status(200).json(updatedProfile.image);
  }
  const photoUrl = await cloudinary.uploader.upload(file);

  const updatedProfile = await User.findOneAndUpdate(
    { userName },
    { image: photoUrl.url },
    { new: true }
  );

  res.status(200).json(updatedProfile.image);
});

export const updateProfile = expressAsyncHandler(async (req, res) => {
  const userId = req.userId;
  const { firstName, lastName, userName, email, phone, about, occupation } =
    req.body;
  const { user } = req.params;

  const userExists = await User.findOne({ userName: user });

  if (!userExists) {
    return res.status(404).json({ message: "User not found" });
  }

  if (String(userExists._id) !== String(userId)) {
    return res
      .status(400)
      .json({ message: "You cannot edit someone else's profile" });
  }

  const existUserName = await User.findOne({ userName });
  if (existUserName && userName !== userExists.userName) {
    return res.status(400).json({ message: "Username already in use" });
  }

  const existEmail = await User.findOne({ email });
  if (existEmail && email !== userExists.email) {
    return res.status(400).json({ message: "E-mail already in use" });
  }

  const updatedProfile = await User.findOneAndUpdate(
    { userName: user },
    {
      firstName,
      lastName,
      userName,
      email,
      phone: phone || userExists.phone,
      about: about || userExists.about,
      occupation: occupation || userExists.occupation,
    },
    { new: true }
  );

  res.status(200).json({
    firstName: updatedProfile.firstName,
    lastName: updatedProfile.lastName,
    userName: updatedProfile.userName,
    email: updatedProfile.email,
    phone: updatedProfile.phone,
    about: updatedProfile.about,
    occupation: updatedProfile.occupation,
  });
});

export const updateAddress = expressAsyncHandler(async (req, res) => {
  const userId = req.userId;
  const { country, state, postalCode } = req.body;
  const { userName } = req.params;

  const userExists = await User.findOne({ userName });

  if (!userExists) {
    return res.status(404).json({ message: "User not found" });
  }

  if (String(userExists._id) !== String(userId)) {
    return res
      .status(400)
      .json({ message: "You cannot edit someone else's profile" });
  }

  const updatedProfile = await User.findOneAndUpdate(
    { userName },
    {
      country: country || userExists.country,
      state: state || userExists.state,
      postalCode: postalCode || userExists.postalCode,
    },
    { new: true }
  );

  res.status(200).json({
    country: updatedProfile.country,
    state: updatedProfile.state,
    postalCode: updatedProfile.postalCode,
  });
});

export const deleteUser = expressAsyncHandler(async (req, res) => {
  const { userName } = req.params;
  const userId = req.userId;

  const userExists = await User.findOne({ userName });
  if (!userExists) {
    return res.status(404).json({ message: "User not found" });
  }

  if (String(userExists._id) !== String(userId)) {
    return res
      .status(400)
      .json({ message: "You cannot delete someone else's profile" });
  }

  const deletedUser = await User.findByIdAndRemove(userExists._id);
  res.status(200).json({
    data: deletedUser,
    message: "Your account has been deleted successfully.",
  });
});

export const updatePassword = expressAsyncHandler(async (req, res) => {
  const userId = req.userId;
  const { newPassword, password } = req.body;
  const { userName } = req.params;

  const userExists = await User.findOne({ userName });

  if (!userExists) {
    return res.status(404).json({ message: "User not found" });
  }

  if (String(userExists._id) !== String(userId)) {
    return res
      .status(400)
      .json({ message: "You cannot edit someone else's profile" });
  }

  const matchPassword = await userExists.matchPassword(password);
  if (!matchPassword) {
    return res.status(400).json({ message: "Password is not correct" });
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);

  await User.findOneAndUpdate({ userName }, { password: hash }, { new: true });

  res.status(200).json({ message: "Password changed successfully" });
});
