import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Blog from "../models/Blogs.js";
import createHttpError from "http-errors";

//start
export const getComments = async (req, res, next) => {
  try {
    const { blogId, length } = req.query;
    const LIMIT = 5;
    const SKIP = Number(length);

    const totalComments = await Comment.countDocuments({ blogId });

    const getComments = await Comment.find({ blogId })
      .sort({
        createdAt: -1,
      })
      .skip(SKIP)
      .limit(LIMIT)
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

    res.status(200).json({ data: getComments, totalComments });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req, res) => {
  try {
    const { comment, blogId } = req.body;
    const creator = req.userId;

    if (!comment) {
      throw createHttpError(400, "Parameters missing");
    }

    const checkBlogExist = await Blog.findById(blogId);
    if (!checkBlogExist) {
      throw createHttpError(400, "Blog does not exist");
    }

    const checkUser = await User.findById(creator);
    if (!checkUser) {
      throw createHttpError(400, "User does not exist");
    }

    const newComment = await Comment.create({
      comment,
      blogId: checkBlogExist._id,
      creator: checkUser._id,
    });
    await newComment.populate("creator");

    checkBlogExist.comments.push(newComment._id);
    await checkBlogExist.save();

    const totalComments = await Comment.countDocuments({ blogId });
    res.status(201).json({ data: newComment, totalComments });
  } catch (error) {
    next(error);
  }
};

export const createChildComment = async (req, res, next) => {
  try {
    const { childComment, commentId } = req.body;
    const userId = req.userId;

    if (!childComment) {
      throw createHttpError(400, "Parameters missing");
    }

    const checkUser = await User.findById(userId);
    if (!checkUser) {
      throw createHttpError(400, "User does not exist");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw createHttpError(400, "Comment does not exist");
    }

    const newChildComment = {
      comment: childComment,
      creator: checkUser._id,
      createdAt: new Date(),
    };
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
  } catch (error) {
    next(error);
  }
};

export const likeComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    const checkUser = await User.findById(userId);
    if (!checkUser) {
      throw createHttpError(400, "User does not exist");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw createHttpError(
        400,
        "The comment you are trying to like does not exist"
      );
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
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId, blogId } = req.query;
    const userId = req.userId;

    const checkUser = await User.findById(userId);
    if (!checkUser) {
      throw createHttpError(400, "User does not exist");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw createHttpError(
        400,
        "The comment you are trying to delete does not exist"
      );
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw createHttpError(400, "Blog does not exist");
    }

    const checkCommentOwner = Boolean(
      String(userId) === String(comment.creator)
    );
    if (!checkCommentOwner) {
      throw createHttpError(400, "You can't delete someone else's comment");
    }

    const deletedComment = await Comment.findByIdAndRemove(commentId);

    const removeFromBlog = blog.comments.map((item) =>
      String(item).indexOf(String(commentId))
    );
    blog.comments.splice(removeFromBlog, 1);
    await Blog.findByIdAndUpdate(blogId, blog, { new: true });

    const totalComments = await Comment.countDocuments({ blogId });
    res.status(200).json({ id: deletedComment._id, totalComments });
  } catch (error) {
    next(error);
  }
};

export const deleteChildComment = async (req, res, next) => {
  try {
    const { commentId, childCommentId, blogId } = req.body;
    const userId = req.userId;

    const checkUser = await User.findById(userId);
    if (!checkUser) {
      throw createHttpError(400, "User not found");
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw createHttpError(400, "Blog not found");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw createHttpError(400, "Comment does not exist");
    }

    const indexOfChildComment = comment.childComments
      .map((item) => String(item._id))
      .indexOf(String(childCommentId));

    const checkOwner = Boolean(
      String(comment.childComments[indexOfChildComment].creator) ===
        String(userId)
    );
    if (!checkOwner) {
      throw createHttpError(400, "You can not delete someone else's comment");
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
  } catch (error) {
    next(error);
  }
};

export const likeChildComment = async (req, res, next) => {
  try {
    const { commentId, childCommentId, blogId } = req.body;
    const userId = req.userId;

    const checkUser = await User.findById(userId);
    if (!checkUser) {
      throw createHttpError(400, "User not found");
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw createHttpError(400, "Blog not found");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw createHttpError(400, "Comment does not exist");
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
  } catch (error) {
    next(error);
  }
};
//end
