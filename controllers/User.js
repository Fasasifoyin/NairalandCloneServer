import User from "../models/User.js";
import Blog from "../models/Blogs.js";
import createHttpError from "http-errors";
import axios from "axios";
import { generateToken } from "../config/token.js";

import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import * as dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { sendMail } from "./Mail.js";
import AddMinutesToDate from "../config/time.js";

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//start
export const Signup = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      password,
      googleAccessToken,
    } = req.body;

    if (
      (!firstName || !lastName || !userName || !email || !password) &&
      !googleAccessToken
    ) {
      throw createHttpError(400, "Parameters missing");
    }

    let userDetails;

    if (googleAccessToken) {
      try {
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
          userName: data.email.split("@")[0].toLowerCase(),
          email: data.email,
          password: process.env.PASSWORD,
          image: data.picture,
          isGoogle: true,
        };
      } catch (error) {
        console.log(error);
        throw createHttpError(400, "Invalid Google access token");
      }
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
      throw createHttpError(400, "E-mail already in use");
    }

    let existUserName = await User.findOne({
      userName: userDetails.userName,
    });
    if (existUserName) {
      // Google signup: Append suffix if username exists
      if (userDetails.isGoogle) {
        let suffix = 1;
        const baseUsername = userDetails.userName;
        while (existUserName) {
          userDetails.userName = baseUsername + suffix;
          existUserName = await User.findOne({
            userName: userDetails.userName,
          });
          suffix++;
        }
      } else {
        // Manual signup: Throw error for duplicate username
        throw createHttpError(400, "User name already in use");
      }
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
  } catch (error) {
    next(error);
  }
};

export const Signin = async (req, res, next) => {
  try {
    const { userName, password, googleAccessToken } = req.body;
    if ((!userName || !password) && !googleAccessToken) {
      throw createHttpError(400, "Parameters missing");
    }

    let user;

    if (googleAccessToken) {
      try {
        const { data } = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${googleAccessToken}`,
            },
          }
        );
        user = await User.findOne({ email: data.email });
      } catch (error) {
        console.log(error);
        throw createHttpError(400, "Invalid Google access token");
      }
    } else {
      user = await User.findOne({ userName });
    }

    if (!user) {
      throw createHttpError(400, "Invalid Credentials");
    }

    if (!googleAccessToken) {
      const matchPassword = await user.matchPassword(password);
      if (!matchPassword) {
        throw createHttpError(400, "Invalid Credentials");
      }
    }

    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      image: user.image,
      isAdmin: user.isAdmin,
      isGoogle: user.isGoogle,
      token: generateToken(user),
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const { userName, page } = req.params;

    const LIMIT = 2;
    const PAGE = Number(page) || 1;
    const SKIP = (PAGE - 1) * LIMIT;

    const getProfile = await User.findOne({ userName }).populate({
      path: "allBlogs",
      options: {
        sort: { createdAt: -1 },
        skip: SKIP,
        limit: LIMIT,
      },
    });

    if (!getProfile) {
      throw createHttpError(
        400,
        `${userName} does not seem to be a valid user`
      );
    }

    const result = await User.aggregate([
      { $match: { userName } },
      { $project: { totalBlogs: { $size: "$allBlogs" } } },
    ]);

    const totalBlogs = result[0]?.totalBlogs || 0;
    const totalPages = Math.ceil(totalBlogs / LIMIT);

    return res.status(200).json({ data: getProfile, totalPages });
  } catch (error) {
    next(error);
  }
};

export const getUserBlogs = async (req, res, next) => {
  try {
    const { userName, search, page } = req.query;

    const LIMIT = 2;
    const PAGE = Number(page) || 1;
    const SKIP = (PAGE - 1) * LIMIT;

    const user = await User.findOne({ userName });
    if (!user) {
      throw createHttpError(
        400,
        `${userName} does not seem to be a valid user`
      );
    }

    const totalBlogs = await Blog.countDocuments({
      _id: { $in: user.allBlogs },
      title: { $regex: search, $options: "i" },
    });

    const blogs = await Blog.find({
      _id: { $in: user.allBlogs },
      title: { $regex: search, $options: "i" },
    })
      .sort({ createdAt: -1 })
      .skip(SKIP)
      .limit(LIMIT);

    return res.json({
      data: blogs,
      totalPages: Math.ceil(totalBlogs / LIMIT),
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { user } = req.params;
    const {
      firstName,
      lastName,
      userName,
      email,
      occupation,
      about,
      phone,
      country,
      state,
      postalCode,
    } = req.body;
    if (!firstName || !lastName || !userName || !email) {
      throw createHttpError(
        400,
        "There has to be first name, last name, username and email address"
      );
    }

    const userExists = await User.findOne({ userName: user });
    if (!userExists) {
      throw createHttpError(400, "User not found");
    }
    if (String(userExists._id) !== String(userId)) {
      throw createHttpError(400, "You cannot edit someone else's profile");
    }

    if (
      userExists.isGoogle &&
      (userExists.firstName !== firstName ||
        userExists.lastName !== lastName ||
        userExists.email !== email ||
        userExists.userName !== userName)
    ) {
      throw createHttpError(
        400,
        "You signed in with google account, you are not allowed to change first name, lat name, username or email address"
      );
    }

    const existUserName = await User.findOne({ userName });
    if (existUserName && userName !== userExists.userName) {
      throw createHttpError(400, "Username already in use");
    }
    const existEmail = await User.findOne({ email });
    if (existEmail && email !== userExists.email) {
      throw createHttpError(400, "Email already in use");
    }

    const updatedProfile = await User.findOneAndUpdate(
      { userName: user },
      {
        firstName,
        lastName,
        userName,
        email,
        phone,
        about,
        occupation,
        country,
        state,
        postalCode,
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
      country: updatedProfile.country,
      state: updatedProfile.state,
      postalCode: updatedProfile.postalCode,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePhoto = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { userName, file } = req.body;

    const userExists = await User.findOne({ userName });
    if (!userExists) {
      throw createHttpError(400, "User not found");
    }
    if (String(userExists._id) !== String(userId)) {
      throw createHttpError(400, "You cannot edit someone else's profile");
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
  } catch (error) {
    next(error);
  }
};
//end

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
