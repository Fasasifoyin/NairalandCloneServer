import { Router } from "express";
import { Signin, Signup, getUserDetails, updatePhoto } from "../controllers/User.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/signin", Signin);
router.post("/signup", Signup);
router.get("/profile/:userName", auth, getUserDetails);

router.patch("/profile/updatePhoto", auth, updatePhoto)

export default router;
