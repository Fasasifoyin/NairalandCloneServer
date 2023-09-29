import Blog from "../models/Blogs.js";
import Tags from "../models/Tags.js";
import expressAsyncHandler from "express-async-handler";

export const search = expressAsyncHandler(async (req, res) => {
  const LIMIT = 10;
  const page = Number(req.query.page) || 1;

  const search = { $regex: req.query.search, $options: "i" } || "";
  let title = req.query.title || "true";
  let body = req.query.body || "false";
  let category = req.query.category || "false";
  let categories = req.query.categories || "All";

  const getCategories = await Tags.find();

  if (categories === "All") {
    categories = getCategories.map((each) => each.tag);
  } else {
    const check = req.query.categories
      .split(",")
      .every((element) => getCategories.some(({ tag }) => tag === element));
    if (!check) {
      return res.status(400).json({ message: "There is an error" });
    }
    categories = req.query.categories.split(",");
  }

  let searchResult = [];

  if (title === "true" && body === "false" && category === "false") {
    searchResult = await Blog.find({
      $and: [{ title: search }, { tags: { $in: categories } }],
    });
  } else if (title === "false" && body === "true" && category === "false") {
    searchResult = await Blog.find({
      $and: [{ body: search }, { tags: { $in: categories } }],
    });
  } else if (title === "false" && body === "false" && category === "true") {
    searchResult = await Blog.find({
      tags: { $in: [req.query.search] },
    }).collation({ locale: "en", strength: 2 });
  } else if (title === "true" && body === "true" && category === "false") {
    searchResult = await Blog.find({
      $or: [
        { $and: [{ title: search }, { tags: { $in: categories } }] },
        { $and: [{ body: search }, { tags: { $in: categories } }] },
      ],
    });
  } else if (title === "true" && body === "false" && category === "true") {
    searchResult = await Blog.find({
      $or: [
        { $and: [{ title: search }, { tags: { $in: categories } }] },
        { tags: { $in: [req.query.search] } },
      ],
    }).collation({ locale: "en", strength: 2 });
  } else if (title === "false" && body === "true" && category === "true") {
    searchResult = await Blog.find({
      $or: [
        { $and: [{ body: search }, { tags: { $in: categories } }] },
        { tags: { $in: [req.query.search] } },
      ],
    }).collation({ locale: "en", strength: 2 });
  } else if (title === "true" && body === "true" && category === "true") {
    searchResult = await Blog.find({
      $or: [
        { $and: [{ title: search }, { tags: { $in: categories } }] },
        { $and: [{ body: search }, { tags: { $in: categories } }] },
        { tags: { $in: [req.query.search] } },
      ],
    }).collation({ locale: "en", strength: 2 });
  } else {
    searchResult = [];
  }

  return res.status(200).json(searchResult);
});
