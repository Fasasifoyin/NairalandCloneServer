import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import userRoutes from "./routes/User.js";
import blogRoutes from "./routes/Blogs.js";
import tagsRoutes from "./SendTagsToMongo.js";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cors());
dotenv.config();

app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/import", tagsRoutes);

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => app.listen(6060, () => console.log("APP CONNECTED")))
  .catch((error) => console.log(error));
