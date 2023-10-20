import nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config();

export const sendMail = async (body) => {
  const { email, text, subject } = body;
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
      subject,
      text,
    });
    return { message: "Success", status: 200 };
  } catch (error) {
    console.log(error);
    return { message: error.message, status: 500 };
  }
};
