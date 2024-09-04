import createHttpError from "http-errors";
import Blog from "../../models/Blogs.js";
import expressAsyncHandler from "express-async-handler";
import { randomBlogsToken, verifyBlogsToken } from "../../config/token.js";
import mongoose from "mongoose";

//start
export const getLatestNews = async (req, res, next) => {
  try {
    const { page } = req.params;
    if (!page) {
      throw createHttpError(400, "No page number specified");
    }

    const resultsPerPage = 20;
    const skip = (page - 1) * resultsPerPage;
    const totalResults = await Blog.countDocuments({});

    const results = await Blog.find()
      .sort({ createdAt: -1 })
      .limit(resultsPerPage)
      .skip(skip);

    return res.status(200).json({
      data: results,
      page: page,
      totalPages: Math.ceil(totalResults / resultsPerPage),
    });
  } catch (error) {
    next(error);
  }
};

export const getTagBlogs = async (req, res, next) => {
  try {
    const tagRequests = req.body;
    if (!Array.isArray(tagRequests) || tagRequests.length === 0) {
      throw createHttpError(400, "Invalid input data");
    }

    // Create an array of promises for each tag request
    const promises = tagRequests.map(async ({ tag, number }) => {
      const blogs = await Blog.aggregate([
        { $match: { tags: tag } },
        { $sample: { size: number } },
      ]);
      return { tag, blogs };
    });

    // Wait for all promises to resolve
    const results = await Promise.all(promises);

    // Send the response with the results
    return res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

export const randomBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const token = req.headers["x-blog-pagination-token"];

    const totalBlogs = await Blog.countDocuments();
    const totalPages = Math.ceil(totalBlogs / 10);

    const PAGE_SIZE =
      page < totalPages ? 10 : totalBlogs % 10 === 0 ? 10 : totalBlogs % 10;

    if (page > totalPages) {
      return res.status(200).json({
        data: [],
        totalPages,
      });
    }

    let sessionData = {};

    if (!token) {
      sessionData.blogPages = {};
    }

    if (token) {
      sessionData = verifyBlogsToken(token);
      if (!sessionData.blogPages) {
        throw createHttpError(400, "Invalid token");
      }
    }

    let usedBlogIds = new Set();
    for (const key in sessionData.blogPages) {
      sessionData.blogPages[key].forEach((id) => usedBlogIds.add(id));
    }

    const mongooseObjectIds = Array.from(usedBlogIds).map((id) =>
      typeof id === "string" ? new mongoose.Types.ObjectId(id) : id
    );

    if (!sessionData.blogPages[page]) {
      const aggregation = [
        { $match: { _id: { $nin: mongooseObjectIds } } },
        { $sample: { size: PAGE_SIZE } },
      ];

      const randomBlogs = await Blog.aggregate(aggregation);

      sessionData.blogPages[page] = randomBlogs.map((blog) =>
        blog._id.toString()
      );
      const newToken = randomBlogsToken(sessionData);

      return res
        .setHeader("x-blog-pagination-token", newToken)
        .status(200)
        .json({
          data: randomBlogs,
          totalPages,
        });
    }

    const blogIds = sessionData.blogPages[page].map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const blogs = await Blog.aggregate([
      { $match: { _id: { $in: blogIds } } },
      { $addFields: { sortOrder: { $indexOfArray: [blogIds, "$_id"] } } },
      { $sort: { sortOrder: 1 } },
    ]);

    return res.status(200).json({ data: blogs, totalPages });
  } catch (error) {
    next(error);
  }
};

export const getSingleBlog = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const single = await Blog.findOne({ slug }).populate("author");

    if (!single) {
      throw createHttpError(400, "Blog not found");
    }

    res.status(200).json(single);
  } catch (error) {
    next(error);
  }
};

export const checkTagsNumber = async (req, res, next) => {
  try {
    const result = await Blog.aggregate([
      { $unwind: "$tags" }, // Deconstructs the tags array field from the input documents to output a document for each element
      { $group: { _id: "$tags", count: { $sum: 1 } } }, // Groups by each tag and counts the number of occurrences
      { $sort: { count: -1 } }, // Sorts the result by count in descending order
    ]);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
//end

export const getRandomBlogs = expressAsyncHandler(async (req, res) => {
  const { qty } = req.params;
  const total = 20;

  let finalqty;
  if (Number(qty) > total) {
    return res
      .status(400)
      .json({ message: `Maximum of ${total} random blogs` });
  } else {
    finalqty = Number(qty);
  }

  const numbers = [];
  for (let i = 0; i < total; i++) {
    numbers.push(i);
  }

  const random = [...numbers]
    .sort(() => (Math.random() > 0.5 ? 1 : -1))
    .slice(0, finalqty);

  const blogs = await Blog.find().sort({ _id: -1 }).limit(total);

  const data = [];
  for (let i = 0; i < random.length; i++) {
    const blog = blogs[random[i]];
    data.push(blog);
  }

  return res.status(200).json(data);
});

export const getNewPageSlider = expressAsyncHandler(async (req, res) => {
  const { qty } = req.params;
  const LIMIT = Number(qty);
  const total = await Blog.countDocuments({});
  if (LIMIT > total) {
    return res.status(400).json({ message: `Maximum of ${total} blogs` });
  }

  const data = await Blog.find().sort({ _id: -1 }).limit(LIMIT);
  res.status(200).json(data);
});

export const getNewBlog = expressAsyncHandler(async (req, res) => {
  const { page } = req.params;

  const LIMIT = 6;
  const startIndex = (Number(page) - 1) * LIMIT + 3; // get start index of every page
  const total = await Blog.countDocuments({});

  const newBlogs = await Blog.find()
    .sort({ _id: -1 })
    .limit(LIMIT)
    .skip(startIndex);

  if (!newBlogs) {
    return res.status(400).json({ message: "No new blog" });
  }

  res.status(200).json({
    data: newBlogs,
    totalPages: Math.ceil((total - 3) / LIMIT),
  });
});
