import jwt from "jsonwebtoken";

const generateToken = (userDetails) => {
  const id = userDetails._id;
  const userName = userDetails.userName;

  return jwt.sign({ id, userName }, process.env.JWT_SECRET, {
    expiresIn: "3h",
  });
};

export default generateToken;
