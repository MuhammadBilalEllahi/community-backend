const express = require("express");
const { addCommentToDiscussion, addReplyToComment, upVoteCommentOrReply, downVoteCommentOrReply } = require("../../controllers/discussion/comment.controller");
const router = express.Router()


router.post("/up-vote", upVoteCommentOrReply)
router.post("/down-vote", downVoteCommentOrReply)

router.post('/add-comment', addCommentToDiscussion)
router.post('/reply-to-comment', addReplyToComment)



module.exports = router;