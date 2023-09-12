import { Router } from "express"
import Tags from "./models/Tags.js"
import TagsData from "./TagsData.js"

const router = Router()

router.post("/tags", async (req, res) => {
    await Tags.deleteMany({})
    const tagsList = await Tags.insertMany(TagsData.tags)
    res.send({ tagsList })
})

export default router