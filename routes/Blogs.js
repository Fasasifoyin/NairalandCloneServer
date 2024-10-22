import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { createBlog, deleteBlog, updateBlog } from "../controllers/Blogs/OTHERBlogs.js";
import {
  getRandomBlogs,
  getNewBlog,
  getNewPageSlider,
  getSingleBlog,
  getLatestNews,
  checkTagsNumber,
  getTagBlogs,
  randomBlogs,
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
import { search } from "../controllers/Search.js";

const router = Router();

//start
router.get("/latest/:page", getLatestNews)
router.post("/getblogsbytags", getTagBlogs)
router.get("/randomblogs", randomBlogs)

router.get("/:slug", getSingleBlog);
router.get("/tags/related", getRelatedTags);
router.get("/get/comment", getComments);
router.post("/create/comment", auth, createComment);

router.get("/number/checkTags", checkTagsNumber)

router.post("/create", auth, createBlog);
router.patch("/update", auth, updateBlog);
//end

router.delete("/delete/:blogId", auth, deleteBlog)


router.patch("/comment/like/:commentId", auth, likeComment);
router.patch("/comment/childcomment", auth, createChildComment);
router.patch("/comment/childcomment/like", auth, likeChildComment);
router.delete("/comment/delete", auth, deleteComment);
router.patch("/comment/deletechildcomment", auth, deleteChildComment);

router.get("/homepage/:page", homePageTagsList);

router.get("/newpage/slider/:qty", getNewPageSlider);
router.get("/new/:page", getNewBlog);


router.get("/random/tags/:qty", getRandomTags);
router.get("/random/blogs/:qty", getRandomBlogs);
router.get("/footer/:qty", getRandomBlogs);


router.get("/blog/search", search)


export default router;
