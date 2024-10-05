import createHttpError from "http-errors";
import Blog from "../models/Blogs.js";
import Tags from "../models/Tags.js";

const buildSearchQuery = (search, searchTags, title, body) => {
  const searchQuery = {
    tags: { $in: searchTags },
  };

  if (title === "true") {
    searchQuery.$or = [{ title: { $regex: search, $options: "i" } }];
  }

  if (body === "true") {
    searchQuery.$or = [{ body: { $regex: search, $options: "i" } }];
  }

  if (body === "true" && title === "true") {
    searchQuery.$or = [
      { title: { $regex: search, $options: "i" } },
      { body: { $regex: search, $options: "i" } },
    ];
  }
  return searchQuery;
};

export const search = async (req, res, next) => {
  try {
    const { title, body, tags, search, page } = req.query;

    if (!search || search === "undefined") {
      throw createHttpError(400, "No search");
    }

    if (title !== "true" && body !== "true") {
      throw createHttpError(400, "Select either title or body or both");
    }

    const LIMIT = 10;
    const PAGE = Number(page) || 1;
    const SKIP = (page - 1) * LIMIT;

    let searchTags = [];

    if (!tags || tags === "undefined") {
      const getAllTags = await Tags.find();
      searchTags = getAllTags.map((each) => each.tag);
    } else {
      searchTags = tags.split(",");
    }

    const searchQuery = buildSearchQuery(search, searchTags, title, body);
    const totaLSearch = await Blog.countDocuments(searchQuery);
    const searchResults = await Blog.find(searchQuery)
      .sort({
        createdAt: -1,
      })
      .skip(SKIP)
      .limit(LIMIT);

    res.status(200).json({
      data: searchResults,
      totalPages: Math.ceil(totaLSearch / LIMIT),
    });
  } catch (error) {
    next(error);
  }
};
