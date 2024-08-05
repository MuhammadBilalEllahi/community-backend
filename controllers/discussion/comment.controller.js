const Comment = require("../../models/discussion/comment.model");
const Discussion = require("../../models/discussion/discussion.model");
const User = require("../../models/user.model");

const addCommentToDiscussion = async (req, res) => {
    const { toBeDiscussedId, userId, commentContent } = req.body

    console.log(" toBeDiscussedId, userId, commentContent: ", toBeDiscussedId, userId, commentContent)

    try {
        const user = await User.findById(userId);
        // console.log(user)
        if (!user) {
            throw new Error('User not found');
        }

        const comment = new Comment({ content: commentContent, user: user._id });
        await comment.save();
        const discussion = await Discussion.findById(toBeDiscussedId);
        // console.log("Dis ", discussion)
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



const upVoteCommentOrReply = async (req, res) => {
    const { commentId, userId } = req.body;
    let downVoteBool = false;
    let upVoteBool = false;
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ error: "User does not exist" })

        const comment = await Comment.findById(commentId)
        if (!comment) return res.status(404).json({ error: "Comment does not exist" })

        const hasDownvoted = comment.downvotes.includes(userId);
        if (hasDownvoted) {
            comment.downvotes.pull(userId);
            downVoteBool = false;
        }

        const hasUpvoted = comment.upvotes.includes(userId);
        if (hasUpvoted) {

            comment.upvotes.pull(userId);
            upVoteBool = false
        } else {

            comment.upvotes.push(userId);
            upVoteBool = true
        }

        const updatedComment = await comment.save();
        const upVoteCount = updatedComment.upvotes.length;
        const downVoteCount = updatedComment.downvotes.length * -1;

        return res.status(200).json({ downVoteCount: downVoteCount, upVoteCount: upVoteCount, downVoteBool: downVoteBool, upVoteBool: upVoteBool });

    } catch (error) {
        res.status(500, error.message)
    }
}
const downVoteCommentOrReply = async (req, res) => {
    try {
        const { commentId, userId } = req.body;
        let downVoteBool = false;
        let upVoteBool = false;
        try {

            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ error: "User does not exist" })

            const comment = await Comment.findById(commentId)
            if (!comment) return res.status(404).json({ error: "Comment does not exist" })


            const hasUpvoted = comment.upvotes.includes(userId);
            if (hasUpvoted) {
                comment.upvotes.pull(userId);
                upVoteBool = false
            }
            const hasDownvoted = comment.downvotes.includes(userId);

            if (hasDownvoted) {

                comment.downvotes.pull(userId);
                downVoteBool = false;
            } else {

                comment.downvotes.push(userId);
                downVoteBool = true;
            }

            const updatedComment = await comment.save();
            const downVoteCount = updatedComment.downvotes.length * -1;
            const upVoteCount = updatedComment.upvotes.length;

            return res.status(200).json({ downVoteCount: downVoteCount, upVoteCount: upVoteCount, downVoteBool: downVoteBool, upVoteBool: upVoteBool });


        } catch (error) {
            res.status(500, error.message)
        }
    } catch (error) {
        res.status(500, error.message)
    }
}

module.exports = {
    addCommentToDiscussion,
    addReplyToComment,
    upVoteCommentOrReply,
    downVoteCommentOrReply
}








// const upVoteCommentOrReply = async (req, res) => {
//     const { commentId, userId } = req.body;
//     try {
//         const user = await User.findById(userId)
//         if (!user) return res.status(404).json({ error: "User does not exist" })

//         const comment = await Comment.findById(commentId)
//         if (!comment) return res.status(404).json({ error: "Comment does not exist" })

//         const hasDownvoted = comment.downvotes.includes(userId);
//         if (hasDownvoted) {
//             comment.downvotes.pull(userId);
//         }

//         const hasUpvoted = comment.upvotes.includes(userId);
//         if (hasUpvoted) {

//             comment.upvotes.pull(userId);
//         } else {

//             comment.upvotes.push(userId);
//         }

//         const updatedComment = await comment.save();
//         const upVoteCount = updatedComment.upvotes.length;
//         const downVoteCount = updatedComment.downvotes.length * -1;

//         return res.status(200).json({ downVoteCount: downVoteCount, upVoteCount: upVoteCount });

//         // const isUpvoteAlreadyRegiestered = comment.upvotes.find(userId)
//         // if (isUpvoteAlreadyRegiestered) {
//         //     const updateUpvote = comment.upvotes.pop(userId);
//         //     const updatedUpVote = await updateUpvote.save()
//         //     const upVoteCount = updatedUpVote.upvotes.length;
//         //     return res.status(200).json({ upVoteCount: upVoteCount })
//         // }
//         // const updateUpvote = comment.upvotes.push(userId);
//         // const updatedUpVote = await updateUpvote.save()
//         // const upVoteCount = updatedUpVote.upvotes.length;

//         // res.status(200).json({ upVoteCount: upVoteCount })


//     } catch (error) {
//         res.status(500, error.message)
//     }
// }
// const downVoteCommentOrReply = async (req, res) => {
//     try {
//         const { commentId, userId } = req.body
//         try {
//             const user = await User.findById(userId)
//             if (!user) return res.status(404).json({ error: "User does not exist" })

//             const comment = await Comment.findById(commentId)
//             if (!comment) return res.status(404).json({ error: "Comment does not exist" })

//             const hasUpvoted = comment.upvotes.includes(userId);
//             if (hasUpvoted) {

//                 comment.upvotes.pull(userId);
//             }
//             const hasDownvoted = comment.downvotes.includes(userId);

//             if (hasDownvoted) {

//                 comment.downvotes.pull(userId);
//             } else {

//                 comment.downvotes.push(userId);
//             }

//             const updatedComment = await comment.save();
//             const downVoteCount = updatedComment.downvotes.length * -1;
//             const upVoteCount = updatedComment.upvotes.length;

//             return res.status(200).json({ downVoteCount: downVoteCount, upVoteCount: upVoteCount });


//         } catch (error) {
//             res.status(500, error.message)
//         }
//     } catch (error) {
//         res.status(500, error.message)
//     }
// }



