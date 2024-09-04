import jwt from "jsonwebtoken";

export const generateToken = (userDetails) => {
  const id = userDetails._id;
  const userName = userDetails.userName;

  return jwt.sign({ id, userName }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

export const randomBlogsToken = (payload) => {
  try {
    const options = {}
    if(!payload.exp){
      options.expiresIn = "24h"
    }
    return jwt.sign(payload, process.env.JWT_SECRET, options);
  } catch (error) {
    console.log(error);
  }
};

export const verifyBlogsToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.log(error);
    return null;
  }
};
