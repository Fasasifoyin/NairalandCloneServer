import Blog from "../../models/Blogs.js";
import expressAsyncHandler from "express-async-handler";

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

export const getSingleProduct = expressAsyncHandler(async (req, res) => {
  const { slug } = req.params;
  const single = await Blog.findOne({ slug }).populate("author");
  if (!single) {
    return res.status(404).json({ message: "Blog not found" });
  }
  res.status(200).json(single);
});


