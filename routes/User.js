import { Router } from "express";
import {
  Signin,
  Signup,
  deleteUser,
  getUserDetails,
  resetPassword,
  updateAddress,
  updatePassword,
  updatePhoto,
  updateProfile,
  verifyEmailandGenerateOTP,
  verifyOTP,
} from "../controllers/User.js";
import { auth, localVariable } from "../middleware/auth.js";

const router = Router();

router.post("/signin", Signin);
router.post("/signup", Signup);

router.get("/profile/:userName", auth, getUserDetails);
router.get("/generateotp/:email", localVariable, verifyEmailandGenerateOTP);
router.get("/verifyotp/:code", verifyOTP)

router.patch("/profile/updatePhoto", auth, updatePhoto);
router.patch("/profile/updateProfile/:user", auth, updateProfile);
router.patch("/profile/updateAddress/:userName", auth, updateAddress);
router.patch("/profile/password/:userName", auth, updatePassword);
router.patch("/resetpassword", resetPassword)

router.delete("/profile/delete/:userName", auth, deleteUser);

export default router;
