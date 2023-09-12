// import Blog from "../models/Blogs.js";
// import User from "../models/User.js";
// import Tags from "../models/Tags.js";
// import expressAsyncHandler from "express-async-handler";
// import { toSlug } from "../config/MakeSlug.js";
// import crypto from "crypto";

// import * as dotenv from "dotenv";
// import { v2 as cloudinary } from "cloudinary";
// // import Blogs from "../models/Blogs.js";

// dotenv.config();

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export const createBlog = expressAsyncHandler(async (req, res) => {
//   const id = req.userId;
//   const { title, body, tags, filterImage } = req.body;

//   //Finding user to be sure if he is allowed to create a post
//   const user = await User.findById(id);
//   if (!user) {
//     return res.status(404).json({ message: `You can't create a blog` });
//   }

//   //Checking if the first tag exist
//   const tagExist = await Tags.findOne({ tag: tags[0] });
//   if (!tagExist) {
//     return res.status(404).json({ message: `Invalid tag` });
//   }

//   //creating a slug
//   let slug = toSlug(title);

//   //check if slug already exist
//   const checkSlug = await Blog.findOne({ slug });
//   if (checkSlug) {
//     const id = crypto.randomUUID();
//     slug = `${slug}-${id}`;
//   }

//   //Uploading image to cloudinary
//   const images = [];
//   for (let i = 0; i < filterImage.length; i++) {
//     const upload = await cloudinary.uploader.upload(filterImage[i]);
//     const url = upload.url;
//     images.push(url);
//   }

//   //creating blog
//   const newBlog = await Blog.create({
//     title,
//     body,
//     tags,
//     images,
//     slug,
//     author: user._id,
//   });

//   //Saving blog on user model
//   user.allBlogs.unshift(newBlog._id);
//   await user.save();

//   //Saving blog on tags model
//   tagExist.related.unshift(newBlog._id);
//   tagExist.relatedLength++;
//   await tagExist.save();

//   res.status(201).json({ message: "Blog created successfully" });
// });

// export const getRandomBlogs = expressAsyncHandler(async (req, res) => {
//   const { qty } = req.params;
//   const total = 20;

//   let finalqty;
//   if (Number(qty) > total) {
//     return res
//       .status(400)
//       .json({ message: `Maximum of ${total} random blogs` });
//   } else {
//     finalqty = Number(qty);
//   }

//   const numbers = [];
//   for (let i = 0; i < total; i++) {
//     numbers.push(i);
//   }

//   const random = [...numbers]
//     .sort(() => (Math.random() > 0.5 ? 1 : -1))
//     .slice(0, finalqty);

//   const blogs = await Blog.find().sort({ _id: -1 }).limit(total);

//   const data = [];
//   for (let i = 0; i < random.length; i++) {
//     const blog = blogs[random[i]];
//     data.push(blog);
//   }

//   return res.status(200).json(data);
// });



// // export const deleteBlog = expressAsyncHandler(async (req, res) => {
// //   const { id: blogId } = req.params; // blogId
// //   const id = req.userId; // userId

// //   const user = await User.findById(id);
// //   if (!user) {
// //     return res.status(404).json({ message: `User not found` });
// //   }

// //   const blog = await Blog.findById(blogId);
// //   if (!blog) {
// //     return res.status(404).json({ message: "Blog not found" });
// //   }

// //   if (parseInt(blog.author) !== parseInt(id)) {
// //     return res
// //       .status(400)
// //       .json({ message: "You are not allowed to delete this blog" });
// //   }

// //   const deletedBlog = await Blog.findByIdAndRemove(blogId);

// //   const removeIndex = user.allBlogs.map((item) => item).indexOf(blogId);

// //   user.allBlogs.splice(removeIndex, 1);

// //   await User.findByIdAndUpdate(id, user, {
// //     new: true,
// //   });

// //   res.status(200).json(deletedBlog);
// // });

// // export const likeBlog = expressAsyncHandler(async (req, res) => {
// //   const { id: blogId } = req.params; //blogId
// //   const id = req.userId; //userId

// //   const user = await User.findById(id);
// //   if (!user) {
// //     return res.status(404).json({ message: "User does not exist" });
// //   }

// //   const blog = await Blog.findById(blogId);
// //   if (!blog) {
// //     return res.status(404).json({ message: "Blog not found" });
// //   }

// //   const index = blog.likes.findIndex((each) => each === id);
// //   if (index === -1) {
// //     blog.likes.push(id);
// //   } else {
// //     blog.likes = blog.likes.filter((each) => each !== id);
// //   }

// //   const updatedBlog = await Blog.findByIdAndUpdate(id, blog, {
// //     new: true,
// //   });

// //   res.status(200).json(updatedBlog);
// // });
