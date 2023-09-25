import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { createBlog, deleteBlog, updateBlog } from "../controllers/Blogs/OTHERBlogs.js";
import {
  getRandomBlogs,
  getNewBlog,
  getNewPageSlider,
  getSingleProduct,
} from "../controllers/Blogs/GETBlogs.js";
import {
  getRandomTags,
  getRelatedTags,
  homePageTagsList,
} from "../controllers/Tags.js";
import {
  createChildComment,
  createComment,
  deleteChildComment,
  deleteComment,
  getComments,
  likeChildComment,
  likeComment,
} from "../controllers/Comment.js";

const router = Router();

router.post("/create", auth, createBlog);
router.patch("/update", auth, updateBlog);
router.delete("/delete/:blogId", auth, deleteBlog)


router.post("/create/comment", auth, createComment);
router.get("/get/comment", getComments);
router.patch("/comment/like/:commentId", auth, likeComment);
router.patch("/comment/childcomment", auth, createChildComment);
router.patch("/comment/childcomment/like", auth, likeChildComment);
router.delete("/comment/delete", auth, deleteComment);
router.patch("/comment/deletechildcomment", auth, deleteChildComment);

router.get("/homepage/:page", homePageTagsList);

router.get("/newpage/slider/:qty", getNewPageSlider);
router.get("/new/:page", getNewBlog);

router.get("/:slug", getSingleProduct);

router.get("/random/tags/:qty", getRandomTags);
router.get("/random/blogs/:qty", getRandomBlogs);
router.get("/footer/:qty", getRandomBlogs);

router.get("/tags/related", getRelatedTags);


export default router;
