import Blog from "../../models/Blogs.js";
import User from "../../models/User.js";
import Tags from "../../models/Tags.js";
import expressAsyncHandler from "express-async-handler";
import { toSlug } from "../../config/MakeSlug.js";
import crypto from "crypto";

import * as dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const createBlog = expressAsyncHandler(async (req, res) => {
  const id = req.userId;
  const { title, body, tags, filterImage } = req.body;

  //Finding user to be sure if he is allowed to create a post
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: `You can't create a blog` });
  }

  //Checking if the first tag exist
  const tagExist = await Tags.findOne({ tag: tags[0] });
  if (!tagExist) {
    return res.status(404).json({ message: `Invalid tag` });
  }

  //creating a slug
  let slug = toSlug(title);

  //check if slug already exist
  const checkSlug = await Blog.findOne({ slug });
  if (checkSlug) {
    const id = crypto.randomUUID();
    slug = `${slug}-${id}`;
  }

  //Uploading image to cloudinary
  const images = [];
  for (let i = 0; i < filterImage.length; i++) {
    const upload = await cloudinary.uploader.upload(filterImage[i]);
    const url = upload.url;
    images.push(url);
  }

  //creating blog
  const newBlog = await Blog.create({
    title,
    body,
    tags,
    images,
    slug,
    author: user._id,
  });

  //Saving blog on user model
  user.allBlogs.unshift(newBlog._id);
  await user.save();

  //Saving blog on tags model
  tagExist.related.unshift(newBlog._id);
  tagExist.relatedLength++;
  await tagExist.save();

  res.status(201).json({ message: "Blog created successfully" });
});

export const updateBlog = expressAsyncHandler(async (req, res) => {
  const { title, body, tags, filterImage, blogId } = req.body;
  const userId = req.userId;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: `User not found` });
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json({ message: `Blog not found` });
  }
  const checkOwner = Boolean(String(blog.author) === String(userId));
  if (!checkOwner) {
    return res
      .status(404)
      .json({ message: `You are not allowed to edit this blog` });
  }

  let slug;
  if (title === blog.title) {
    slug = blog.slug;
  } else {
    slug = toSlug(title);
    const checkSlug = await Blog.findOne({ slug });
    if (checkSlug) {
      const id = crypto.randomUUID();
      slug = `${slug}-${id}`;
    }
  }

  const images = [];
  for (let i = 0; i < filterImage.length; i++) {
    const upload = await cloudinary.uploader.upload(filterImage[i]);
    const url = upload.url;
    images.push(url);
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    blogId,
    {
      title,
      body,
      tags,
      images,
      slug,
    },
    { new: true }
  );

  res.status(200).json(updatedBlog);
});
