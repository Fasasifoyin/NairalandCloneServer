import Blog from "../models/Blogs.js";
import Tags from "../models/Tags.js";
import expressAsyncHandler from "express-async-handler";

export const search = expressAsyncHandler(async (req, res) => {
  const { search } = req.query;
});
