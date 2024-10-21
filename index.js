import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import createHttpError, { isHttpError } from "http-errors";

import userRoutes from "./routes/User.js";
import blogRoutes from "./routes/Blogs.js";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    exposedHeaders: ["x-blog-pagination-token"]
  })
);
dotenv.config();

app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);

app.use((req, res, next) => {
  next(createHttpError(404, "Endpoint not found"));
});

app.use((error, req, res, next) => {
  let errorMessage = "An unknown error occurred";
  let statusCode = 500;

  if (isHttpError(error)) {
    errorMessage = error.message;
    statusCode = error.status;
  }

  res.status(statusCode).json({ error: errorMessage });
  console.log(error);
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => app.listen(6060, () => console.log("APP CONNECTED")))
  .catch((error) => console.log(error));
