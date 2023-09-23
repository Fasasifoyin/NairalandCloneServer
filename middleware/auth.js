import jwt from "jsonwebtoken";

export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const isCustomAuth = token.length < 500;

    let decodedData;

    if (token && isCustomAuth) {
      decodedData = await jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decodedData?.id;
    }

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

export const localVariable = (req, res, next) => {
  req.app.locals = {
    OTP: null,
    resetSession: new Date(),
  };
  next();
};
