import Blog from "../../models/Blogs.js";
import User from "../../models/User.js";
import Tags from "../../models/Tags.js";
import expressAsyncHandler from "express-async-handler";
import { toSlug } from "../../config/MakeSlug.js";
import { tagsList } from "../../TagsData.js";
import crypto from "crypto";

import * as dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import Comment from "../../models/Comment.js";
import createHttpError from "http-errors";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//start
export const createBlog = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { title, body, tags, images } = req.body;

    if (!title || !body || tags.length === 0 || images.length === 0) {
      throw createHttpError(400, "Parameters missing");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw createHttpError(400, "You can't create a blog");
    }

    //check tags
    const normalizedTags = [];
    const invalidTags = [];
    tags.forEach((tag) => {
      const foundTag = tagsList.find(
        (predefinedTag) => predefinedTag.toLowerCase() === tag.toLowerCase()
      );
      if (foundTag) {
        normalizedTags.push(foundTag);
      } else {
        invalidTags.push(tag);
      }
    });
    if (invalidTags.length > 0) {
      throw createHttpError(400, `Invalid tags: ${invalidTags.join(",")}`);
    }

    let slug = toSlug(title);
    const checkSlug = await Blog.findOne({ slug });
    if (checkSlug) {
      const id = crypto.randomUUID();
      slug = `${slug}-${id}`;
    }

    const convertedImages = [];
    for (let i = 0; i < images.length; i++) {
      const upload = await cloudinary.uploader.upload(images[i]);
      const url = upload.url;
      convertedImages.push(url);
    }

    const newBlog = await Blog.create({
      title,
      body,
      tags: normalizedTags,
      images: convertedImages,
      slug,
      author: user._id,
    });

    //Saving blog on user model
    user.allBlogs.unshift(newBlog._id);
    await user.save();

    res.status(201).json({ message: "Blog created successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateBlog = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { title, body, tags, images, blogId } = req.body;

    if (!title || !body || tags.length === 0 || images.length === 0 || !blogId) {
      throw createHttpError(400, "Parameters missing");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw createHttpError(400, "You can't create a blog");
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw createHttpError(400, "Blog not found");
    }

    const checkOwner = Boolean(String(blog.author) === String(userId));
    if (!checkOwner) {
      throw createHttpError(400, "You are not allowed to edit this blog");
    }

    const normalizedTags = [];
    const invalidTags = [];
    tags.forEach((tag) => {
      const foundTag = tagsList.find(
        (predefinedTag) => predefinedTag.toLowerCase() === tag.toLowerCase()
      );
      if (foundTag) {
        normalizedTags.push(foundTag);
      } else {
        invalidTags.push(tag);
      }
    });
    if (invalidTags.length > 0) {
      throw createHttpError(400, `Invalid tags: ${invalidTags.join(",")}`);
    }

    let slug;
    if (title.toLowerCase() === blog.title.toLowerCase()) {
      slug = blog.slug;
    } else {
      slug = toSlug(title);
      const checkSlug = await Blog.findOne({ slug });
      if (checkSlug) {
        const id = crypto.randomUUID();
        slug = `${slug}-${id}`;
      }
    }

    const convertedImages = [];
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      if (
        imageUrl.startsWith("http://res.cloudinary.com/dbxvk3apv/image/upload/")
      ) {
        convertedImages.push(imageUrl);
      } else {
        const upload = await cloudinary.uploader.upload(imageUrl);
        const url = upload.url;
        convertedImages.push(url);
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        title,
        body,
        tags: normalizedTags,
        images: convertedImages,
        slug,
      },
      { new: true }
    );

    res.status(200).json(updatedBlog);
  } catch (error) {
    next(error);
  }
};
//end

export const deleteBlog = expressAsyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const userId = req.userId;

  const blogExist = await Blog.findById(blogId);
  if (!blogExist) {
    return res.status(404).json({ message: "Blog not found" });
  }

  const userExist = await User.findById(userId);
  if (!userExist) {
    return res.status(404).json({ message: "User not found" });
  }

  const checkOwner = Boolean(String(blogExist.author) === String(userId));
  if (!checkOwner) {
    return res
      .status(400)
      .json({ message: `You are not allowed to edit this blog` });
  }

  const tagExist = await Tags.findOne({ tag: blogExist.tags[0] });

  const deletedBlog = await Blog.findByIdAndRemove(blogId);
  await Comment.deleteMany({ blogId });

  userExist.allBlogs = userExist.allBlogs.filter(
    (each) => String(each) !== String(blogId)
  );
  await userExist.save();

  tagExist.related = tagExist.related.filter(
    (each) => String(each) !== String(blogId)
  );
  tagExist.relatedLength--;
  await tagExist.save();

  res.status(200).json(deletedBlog);
});
