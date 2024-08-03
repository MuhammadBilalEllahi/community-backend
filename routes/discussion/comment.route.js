const express = require("express");
const { addCommentToDiscussion, addReplyToComment } = require("../../controllers/discussion/comment.controller");
const router = express.Router()

router.post('/add-comment', addCommentToDiscussion)
router.post('/reply-to-comment', addReplyToComment)


module.exports = router;