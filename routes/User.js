import { Router } from "express";
import {
  Signin,
  Signup,
  deleteUser,
  getProfile,
  getUserBlogs,
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

//start
router.post("/signin", Signin);
router.post("/signup", Signup);

router.get("/profile/:userName/:page", auth, getProfile);
router.get("/profile/search", getUserBlogs);

router.patch("/profile/updateProfile/:user", auth, updateProfile);

//end

router.get("/generateotp/:email", localVariable, verifyEmailandGenerateOTP);
router.get("/verifyotp/:code", verifyOTP);

router.patch("/profile/updatePhoto", auth, updatePhoto);
router.patch("/profile/updateAddress/:userName", auth, updateAddress);
router.patch("/profile/password/:userName", auth, updatePassword);
router.patch("/resetpassword", resetPassword);

router.delete("/profile/delete/:userName", auth, deleteUser);

export default router;
