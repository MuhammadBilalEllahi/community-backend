const express = require("express");
const { getDiscussions, getDiscussionOfId, createDiscussionIfNotCreated } = require("../../controllers/discussion/discussion.controller");
const router = express.Router()


router.post("/create-get", createDiscussionIfNotCreated)

router.get("/", getDiscussions)
router.post("/:id", getDiscussionOfId)



module.exports = router;