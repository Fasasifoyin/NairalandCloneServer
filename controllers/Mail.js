import nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config();

export const sendMail = async (req, res) => {
  const { email, firstName, lastName, text, subject } = req.body;
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: process.env.ACCESS_TOKEN,
        tls: {
          rejectUnauthorized: false,
        },
      },
    });

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      text: `Hi ${firstName} ${lastName}. ${text}`,
    });
    return res.status(201).json({ message: "Success" });
  } catch (error) {
    res.status(500).json(error.message);
  }
};
