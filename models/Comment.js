import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: true,
    },
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    childComments: {
      type: [
        {
          comment: { type: String },
          creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          likes: { type: [String], default: [] },
          createdAt: { type: Date, default: new Date() },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
