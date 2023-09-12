import generateToken from "../config/generateToken.js";
import User from "../models/User.js";
import expressAsyncHandler from "express-async-handler";
import otpGenerator from "otp-generator";

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
    occupation: existUser.occupation,
    about: existUser.about,
    token: generateToken(existUser),
  });
});

export const verifyEmail = expressAsyncHandler(async (req, res) => {
  const { email } = req.params;
  const existEmail = await User.findOne({ email });
  if (!existEmail) {
    return res.status(404).json({ message: "Email not found" });
  }

  req.app.locals.OTP = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  res.status(200).json({
    email: existEmail.email,
    OTP: req.app.locals.OTP,
  });
});

export const expireOTP = (req, res) => {
  req.app.locals.OTP = 1234;
};

export const verifyOTP = expressAsyncHandler(async (req, res) => {
  const { OTP } = req.params;
  if (parseInt(req.app.locals.OTP) === 1234) {
    res.status(400).json({ message: "OTP expired" });
  }
  if (parseInt(OTP) === parseInt(req.app.locals.OTP)) {
    req, (app.locals.OTP = null);
    req.app.locals.resetSession = true;

    return res.status(200).json({
      message: "Verified Successfully",
      flag: req.app.locals.resetSession,
    });
  }

  return res.status(400).json({ message: "Invalid OTP" });
});

export const expireSession = (req, res) => {
  req.app.locals.resetSession = false;
  return res.status(200).json({
    flag: req.app.locals.resetSession,
  });
};

export const resetPassword = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!req.app.locals.resetSession) {
    return res.status(440).json({ message: "Session expired" });
  }

  const userExist = await User.findOne({ email });
  if (!userExist) {
    res.status(400).json({ message: "User not found" });
  }

  const hash = await bcrypt.hash(password, 10);

  await User.findOneAndUpdate(
    { email: userExist.email },
    { password: hash },
    { new: true }
  );

  req.app.locals.resetSession = false;
  res.status(200).json({ message: "Password reset successful" });
});
