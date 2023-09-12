import Tags from "../models/Tags.js";
import Blog from "../models/Blogs.js";
import expressAsyncHandler from "express-async-handler";

export const homePageTagsList = expressAsyncHandler(async (req, res) => {
  const { page } = req.params;
  const LIMIT = 9;
  const startIndex = (Number(page) - 1) * LIMIT;
  const total = await Tags.countDocuments({});

  const getHomePageTagsList = await Tags.find()
    .limit(LIMIT)
    .skip(startIndex)
    .populate([
      {
        path: "related",
        model: "Blog",
      },
      {
        path: "related",
        populate: {
          path: "author",
        },
      },
    ]);
  res
    .status(200)
    .json({ data: getHomePageTagsList, totalPages: Math.ceil(total / LIMIT) });
});

export const getRandomTags = expressAsyncHandler(async (req, res) => {
  const { qty } = req.params;
  const total = await Tags.countDocuments({});
  let finalqty;
  if (Number(qty) > total) {
    return res.status(400).json({ message: `Maximum of ${total} random tags` });
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

  const loop = async (randomArrayOfNumbers) => {
    let data = [];

    for (let i = 0; i < randomArrayOfNumbers.length; i++) {
      const randomTag = await Tags.findOne()
        .skip(randomArrayOfNumbers[i])
        .populate("related");
      data.push(randomTag);
    }

    const check = data.every((each) => each.relatedLength > 0);
    if (!check) {
      const anotherRandom = [...numbers]
        .sort(() => (Math.random() > 0.5 ? 1 : -1))
        .slice(0, finalqty);
      loop(anotherRandom);
    } else {
      return res.status(200).json(data);
    }
  };

  loop(random);
});

export const getRelatedTags = expressAsyncHandler(async (req, res) => {
  const { page, tags } = req.query;
  const LIMIT = 10;

  const related = await Blog.find({ tags: { $in: tags.split(",") } });
  if (!related.length) {
    return res.status(400).json({ message: "No related tag found" });
  }
  const total = related.length;
  const sentRelated = related.slice(LIMIT * page - LIMIT, LIMIT * page);
  res
    .status(200)
    .json({ data: sentRelated, totalPages: Math.ceil(total / LIMIT) });
});
