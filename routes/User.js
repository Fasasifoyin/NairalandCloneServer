import { Router } from "express";
import {
  Signin,
  Signup,
  deleteUser,
  getUserDetails,
  updateAddress,
  updatePassword,
  updatePhoto,
  updateProfile,
} from "../controllers/User.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/signin", Signin);
router.post("/signup", Signup);

router.get("/profile/:userName", auth, getUserDetails);

router.patch("/profile/updatePhoto", auth, updatePhoto);
router.patch("/profile/updateProfile/:user", auth, updateProfile);
router.patch("/profile/updateAddress/:userName", auth, updateAddress);
router.patch("/profile/password/:userName", auth, updatePassword);

router.delete("/profile/delete/:userName", auth, deleteUser);

export default router;
