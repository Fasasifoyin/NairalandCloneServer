import nodemailer from "nodemailer";

export const sendMail = async (req, res) => {
  const { email, firstName, lastName, text, subject } = req.body;
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: "gmail",
      port: Number(process.env.PORT),
      secure: Boolean(process.env.SECURE),
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      text: `Hi ${firstName} ${lastName}. ${text}`,
    });
    return res
      .status(201)
      .json({ message: "Success" });
  } catch (error) {
    res.status(500).json(error.message);
  }
};
