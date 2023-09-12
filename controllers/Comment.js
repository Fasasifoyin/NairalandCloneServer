import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Blog from "../models/Blogs.js";
import expressAsyncHandler from "express-async-handler";

export const createComment = expressAsyncHandler(async (req, res) => {
  const { comment, blogId } = req.body;
  const creator = req.userId;

  const checkUser = await User.findById(creator);
  if (!checkUser) {
    return res.status(404).json({ message: `User not found` });
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json({ message: `This blog does not exist` });
  }

  const newComment = await Comment.create({
    comment,
    blogId: blog._id,
    creator: checkUser._id,
  }).then((t) => {
    return t.populate("creator");
  });

  blog.comments.push(newComment._id);
  await blog.save();

  const getComments = await Comment.find({ blogId });
  const total = getComments.length;

  res.status(201).json({ data: newComment, totalComments: total });
});

export const getComments = expressAsyncHandler(async (req, res) => {
  const { blogId, index } = req.query;

  const LIMIT = 5;
  const startIndex = Number(index);
  const getComments = await Comment.find({ blogId })
    .sort({ _id: -1 })
    .populate([
      {
        path: "creator",
        model: "User",
      },
      {
        path: "childComments",
        populate: {
          path: "creator",
        },
      },
    ]);
  const total = getComments.length;
  const sentComment = getComments.slice(startIndex, startIndex + LIMIT);
  res.status(200).json({
    data: sentComment,
    // totalPages: Math.ceil(total / LIMIT),
    totalComments: total,
  });
});

export const likeComment = expressAsyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.userId;

  const checkUser = await User.findById(userId);
  if (!checkUser) {
    return res.status(400).json({ message: "User not found" });
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.status(400).json({ message: "Comment not found" });
  }

  const index = comment.likes.findIndex(
    (each) => String(each) === String(checkUser._id)
  );

  if (index === -1) {
    comment.likes.push(checkUser._id);
  } else {
    comment.likes = comment.likes.filter(
      (each) => String(each) !== String(checkUser._id)
    );
  }

  const updatedComment = await Comment.findByIdAndUpdate(commentId, comment, {
    new: true,
  }).populate([
    {
      path: "creator",
      model: "User",
    },
    {
      path: "childComments",
      populate: {
        path: "creator",
      },
    },
  ]);

  res.status(200).json(updatedComment);
});

export const createChildComment = expressAsyncHandler(async (req, res) => {
  const { childComment, commentId } = req.body;
  const userId = req.userId;

  const checkUser = await User.findById(userId);
  if (!checkUser) {
    return res.status(400).json({ message: "User not found" });
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.status(400).json({ message: "Comment not found" });
  }

  const newChildComment = { comment: childComment, creator: checkUser._id };

  comment.childComments.push(newChildComment);

  const updatedComment = await Comment.findByIdAndUpdate(commentId, comment, {
    new: true,
  }).populate([
    {
      path: "creator",
      model: "User",
    },
    {
      path: "childComments",
      populate: {
        path: "creator",
      },
    },
  ]);

  res.status(200).json(updatedComment);
});

export const likeChildComment = expressAsyncHandler(async (req, res) => {
  const { commentId, childCommentId } = req.body;
  const userId = req.userId;

  const checkUser = await User.findById(userId);
  if (!checkUser) {
    return res.status(400).json({ message: "User not found" });
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.status(400).json({ message: "Comment not found" });
  }

  const indexOfChildComment = comment.childComments
    .map((item) => String(item._id))
    .indexOf(String(childCommentId));

  const index = comment.childComments[indexOfChildComment].likes.findIndex(
    (each) => String(each) === String(checkUser._id)
  );

  if (index === -1) {
    comment.childComments[indexOfChildComment].likes.push(checkUser._id);
  } else {
    comment.childComments[indexOfChildComment].likes = comment.childComments[
      indexOfChildComment
    ].likes.filter((each) => String(each) !== String(checkUser._id));
  }

  const updatedComment = await Comment.findByIdAndUpdate(commentId, comment, {
    new: true,
  }).populate([
    {
      path: "creator",
      model: "User",
    },
    {
      path: "childComments",
      populate: {
        path: "creator",
      },
    },
  ]);

  res.status(200).json(updatedComment);
});

export const deleteComment = expressAsyncHandler(async (req, res) => {
  const { commentId, blogId } = req.query;
  const userId = req.userId;

  const checkUser = await User.findById(userId);
  if (!checkUser) {
    return res.status(400).json({ message: "User not found" });
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json({ message: `This blog does not exist` });
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.status(400).json({ message: "Comment not found" });
  }

  const checkCommentOwner = Boolean(String(userId) === String(comment.creator));

  if (!checkCommentOwner) {
    return res
      .status(400)
      .json({ message: "User not allowed to delete this comment" });
  }

  const deletedComment = await Comment.findByIdAndRemove(commentId);

  const removeFromBlog = blog.comments.map((item) =>
    String(item).indexOf(String(commentId))
  );

  blog.comments.splice(removeFromBlog, 1);

  await Blog.findByIdAndUpdate(blogId, blog, { new: true });

  const getComments = await Comment.find({ blogId });
  const total = getComments.length;

  res.status(200).json({ data: deletedComment, totalComments: total });
});

export const deleteChildComment = expressAsyncHandler(async (req, res) => {
  const { commentId, childCommentId, blogId } = req.body;
  const userId = req.userId;

  const checkUser = await User.findById(userId);
  if (!checkUser) {
    return res.status(400).json({ message: "User not found" });
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json({ message: `This blog does not exist` });
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.status(400).json({ message: "Comment not found" });
  }

  const indexOfChildComment = comment.childComments
    .map((item) => String(item._id))
    .indexOf(String(childCommentId));

  const checkOwner = Boolean(
    String(comment.childComments[indexOfChildComment].creator) ===
      String(userId)
  );

  if (!checkOwner) {
    return res
      .status(400)
      .json({ message: "User not allowed to delete this comment" });
  }

  comment.childComments = comment.childComments.filter(
    (each) => String(each._id) !== String(childCommentId)
  );

  const updateComment = await Comment.findByIdAndUpdate(commentId, comment, {
    new: true,
  }).populate([
    {
      path: "creator",
      model: "User",
    },
    {
      path: "childComments",
      populate: {
        path: "creator",
      },
    },
  ]);

  res.status(200).json(updateComment);
});
