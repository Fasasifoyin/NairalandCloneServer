import createHttpError from "http-errors";
import jwt from "jsonwebtoken";

export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const isCustomAuth = token.length < 500;

    let decodedData;

    if (token && isCustomAuth) {
      decodedData = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decodedData?.id;
    } else {
      decodedData = jwt.decode(token);
      req.userId = decodedData?.sub;
    }

    next();
  } catch (error) {
    next(createHttpError(401, "Authentication failed"));
  }
};

export const localVariable = (req, res, next) => {
  req.app.locals = {
    OTP: null,
    resetSession: new Date(),
  };
  next();
};
