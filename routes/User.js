import { Router } from "express";
import { Signin, Signup, expireOTP, expireSession, resetPassword, verifyEmail, verifyOTP } from "../controllers/User.js";
import { localVariable } from "../middleware/auth.js";

const router = Router();

router.post("/signin", Signin);
router.post("/signup", Signup);

router.get("/verifyemail/:email", localVariable, verifyEmail)
router.get("/exoireOTP", localVariable, expireOTP)
router.get("verifyOTP/:OTP", localVariable, verifyOTP)
router.get("expiresession", localVariable, expireSession)

router.post("/resetpassword", localVariable, resetPassword)

export default router;
