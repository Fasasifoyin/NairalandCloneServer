import generateToken from "../config/generateToken.js";
import User from "../models/User.js";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";

import * as dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { sendMail } from "./Mail.js";
import AddMinutesToDate from "../config/time.js";
import axios from "axios";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const Signup = expressAsyncHandler(async (req, res) => {
  const { firstName, lastName, userName, email, password, googleAccessToken } =
    req.body;

  let userDetails;

  if (googleAccessToken) {
    const { data } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
        },
      }
    );
    userDetails = {
      firstName: data.given_name,
      lastName: data.family_name,
      userName: data.name.split(" ").join(""),
      email: data.email,
      password: `${data.email}${data.name.split(" ").join("")}`,
      image: data.picture,
      isGoogle: true,
    };
  }

  if (!googleAccessToken) {
    userDetails = {
      firstName,
      lastName,
      userName,
      email,
      password,
      isGoogle: false,
    };
  }

  const existEmail = await User.findOne({ email: userDetails.email });
  if (existEmail) {
    return res.status(400).json({ message: "E-mail already in use" });
  }

  const existUserName = await User.findOne({ userName: userDetails.userName });
  if (existUserName) {
    return res.status(400).json({ message: "Username already in use" });
  }

  let newUser = await User.create(userDetails);

  res.status(201).json({
    _id: newUser._id,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    userName: newUser.userName,
    email: newUser.email,
    image: newUser.image,
    isAdmin: newUser.isAdmin,
    isGoogle: newUser.isGoogle,
    token: generateToken(newUser),
  });
});

export const Signin = expressAsyncHandler(async (req, res) => {
  const { userName, password, googleAccessToken } = req.body;

  let userDetails;

  if (googleAccessToken) {
    const { data } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
        },
      }
    );
    userDetails = {
      userName: data.name.split(" ").join(""),
      password: `${data.email}${data.name.split(" ").join("")}`,
    };
  }

  if (!googleAccessToken) {
    userDetails = {
      userName,
      password,
    };
  }

  const existUser = await User.findOne({ userName: userDetails.userName });
  if (!existUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const matchPassword = await existUser.matchPassword(userDetails.password);
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
    isGoogle: existUser.isGoogle,
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

  if (userExists.isGoogle && userName !== userExists.userName) {
    return res.status(400).json({
      message:
        "You signed in with a google account. You are not allowed to change username",
    });
  }

  if (userExists.isGoogle && email !== userExists.email) {
    return res.status(400).json({
      message:
        "You signed in with a google account. You are not allowed to change email",
    });
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
      firstName: firstName || userExists.firstName,
      lastName: lastName || userExists.lastName,
      userName: userName || userExists.userName,
      email: email || userExists.email,
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

  if (userExists.isGoogle) {
    return res.status(400).json({
      message:
        "You signed in with your google account. Therefore you cannot change password ",
    });
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

export const verifyEmailandGenerateOTP = expressAsyncHandler(
  async (req, res) => {
    const { email } = req.params;

    const userExists = await User.findOne({ email });
    if (!userExists) {
      return res.status(404).json({ message: "User does not exist" });
    }

    if (userExists.isGoogle) {
      return res.status(400).json({
        message:
          "You signed in with your google account. Therefore you cannot change password ",
      });
    }

    req.app.locals.OTP = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    const mailSent = await sendMail({
      email: userExists.email,
      text: `Hi ${userExists.lastName} ${userExists.firstName}. You requested for a password change. Your OTP is ${req.app.locals.OTP}`,
      subject: `OTP VERIFICATION`,
    });

    if (mailSent.status === 200) {
      const now = new Date();
      req.app.locals.resetSession = AddMinutesToDate(now, 10);
      return res.status(200).json({
        message: "OTP has been sent to your email address",
        mail: userExists.email,
      });
    } else {
      return res.status(500).json(mailSent.message);
    }
  }
);

export const verifyOTP = expressAsyncHandler(async (req, res) => {
  const { code } = req.params;
  const currentdate = new Date();

  if (currentdate > req.app.locals.resetSession) {
    req.app.locals.OTP = null;
    req.app.locals.resetSession = new Date();
    return res.status(400).json({ message: "OTP expired" });
  } else {
    if (parseInt(code) === parseInt(req.app.locals.OTP)) {
      const now = new Date();
      req.app.locals.OTP = null;
      req.app.locals.resetSession = AddMinutesToDate(now, 5);
      return res.status(200).json({
        message: "Verified Successfully",
      });
    } else {
      return res.status(400).json({ message: "Invalid OTP code" });
    }
  }
});

export const resetPassword = expressAsyncHandler(async (req, res) => {
  const { password, email } = req.body;
  const currentdate = new Date();
  console.log(req.app.locals.resetSession);

  if (currentdate > req.app.locals.resetSession) {
    req.app.locals.OTP = null;
    return res.status(400).json({ message: "Session expired" });
  }

  const userExists = await User.findOne({ email });
  if (!userExists) {
    return res.status(404).json({ message: "User not found" });
  }

  if (userExists.isGoogle) {
    return res.status(400).json({
      message:
        "You signed in with your google account. Therefore you cannot change password ",
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  await User.findOneAndUpdate({ email }, { password: hash }, { new: true });
  res.status(201).json({ message: "Password reset successful" });
});
