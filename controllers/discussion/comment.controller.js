const Comment = require("../../models/discussion/comment.model");
const Discussion = require("../../models/discussion/discussion.model");
const User = require("../../models/user.model");

const addCommentToDiscussion = async (req, res) => {
    const { toBeDiscussedId, userId, commentContent } = req.body

    console.log(" toBeDiscussedId, userId, commentContent: ", toBeDiscussedId, userId, commentContent)

    try {
        const user = await User.findById(userId);
        console.log(user)
        if (!user) {
            throw new Error('User not found');
        }

        const comment = new Comment({ content: commentContent, user: user._id });
        await comment.save();
        const discussion = await Discussion.findById(toBeDiscussedId);
        console.log("Dis ", discussion)
        discussion.comments.push(comment._id);
        await discussion.save();
        res.status(200).json(comment)


    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const addReplyToComment = async (req, res) => {
    const { commentId, replyContent, userId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const reply = new Comment({ content: replyContent, user: user._id });
        await reply.save();
        const comment = await Comment.findById(commentId);
        comment.replies.push(reply._id);
        await comment.save();
        res.status(200).json(reply)
    } catch (error) {
        throw new Error(`Error adding reply to comment: ${error.message}`);
    }
};

// content: { type: String, required: true },
// upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
// downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
// replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
// user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
// }, { timestamps: true });



module.exports = {
    addCommentToDiscussion,
    addReplyToComment
}