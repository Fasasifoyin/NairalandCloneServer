import mongoose from "mongoose";

const tagsSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: true,
  },
  related: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
  relatedLength: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("Tags", tagsSchema);
