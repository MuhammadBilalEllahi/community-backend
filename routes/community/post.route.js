const express = require("express");
const Post = require("../../models/communities/post.model");
const PostsCollection = require("../../models/communities/postsCollection.model");
const User = require("../../models/user/user.model");
const Community = require("../../models/communities/community.model");
const PostComment = require("../../models/communities/postComment.model");
const PostCommentCollection = require("../../models/communities/commentCollection");
const CommunityPostAndCommentVote = require("../../models/communities/CommunityPostAndCommentVote.model");
const { tempStorePosts } = require("../../utils/multer.util");
const { uploadPostMedia } = require("../../utils/aws.bucket.util");
const router = express.Router()





router.get("/details", async (req, res) => {
    const { postId } = req.query;
    try {

        const postDetails = await Post.findById({ _id: postId }).populate({
            path: 'author',
            select: 'name universityEmailVerified personalEmailVerified',
        })
        // console.log(postDetails)
        res.status(200).json(postDetails)

    } catch (error) {
        console.error("Error in creating post", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

router.get("/details/comments", async (req, res) => {
    const { postId } = req.query;
    try {

        const commentDetails = await PostCommentCollection.findById({ _id: postId })
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'name profilePic personalEmailVerified universityEmailVerified personalEmail universityEmail'
                }
            })
            .populate({
                path: "comments",

                populate: {
                    path: 'vote',
                    select: 'upVotesCount downVotesCount upvotes downvotes',
                }
            })
        //.populate('comments.author')
        // console.log(commentDetails)
        res.status(200).json(commentDetails)

    } catch (error) {
        console.error("Error in creating post", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})





//set latest post in community (unshift )
// router.post("/create", async (req, res) => {


//     tempStorePosts(req, res, async function (err) {
//         if (err) {
//             console.error("Multer error: ", err);
//             return res.status(500).json({ error: "File upload failed" });
//         }


//         try {
//             const { title, body, communityId, author, media, contentType } = req.body;
//             // console.log("check ", req.body)
//             // return;

//             const communityExists = await Community.findById({ _id: communityId })
//             if (!communityExists) return res.status(404).json({ error: "Error Occured Finding this Community" })
//             // console.log(communityExists)
//             const user = await User.findById({ _id: author })
//             if (!user) return res.status(404).json({ error: "Error Occured, Are you signed In?" })
//             // console.log(user)

//             const data = body ?
//                 {
//                     title: title,
//                     body: body,
//                     community: communityId,
//                     author: author
//                 }
//                 :
//                 {
//                     title: title,
//                     community: communityId,
//                     author: author
//                 }

//             const createPost = await Post.create(data)
//             createPost.save()
//             // console.log(createPost)
//             if (communityId === author) {
//                 return;
//             }
//             const addToPostsCollection = await PostsCollection.findById({ _id: communityId })
//             if (!addToPostsCollection) return res.status(404).json({ error: "Error Occured, who delted post collection record" })

//             addToPostsCollection.posts.unshift({
//                 postId: createPost._id
//             })

//             addToPostsCollection.save()

//             const createCommentCollection = await PostCommentCollection.create({ _id: createPost._id })
//             createCommentCollection.save()

//             // console.log(addToPostsCollection)
//             // console.log(createCommentCollection)


//             const updatePostToAddCommentId = await Post.findByIdAndUpdate(createPost._id,
//                 {
//                     comments: createCommentCollection._id
//                 },
//             )
//             // console.log("updatePostToAddCommentId", updatePostToAddCommentId)




//             const voteCollection_create = await CommunityPostAndCommentVote.create({
//                 postId: createPost._id
//             })

//             voteCollection_create.save()


//             const add_VoteCollection_ToPost = await Post.findById({ _id: createPost._id })
//             add_VoteCollection_ToPost.vote = voteCollection_create._id

//             add_VoteCollection_ToPost.save()


//             const { mediaUrl } = await uploadPostMedia(communityExists._id.toString(), req.files, req, false)

//             if (mediaUrl) {
//                 createPost.media.type = contentType
//                 createPost.media.url = mediaUrl
//                 await createPost.save()
//             }


//             // console.log("\nThis is create POST: ", createPost)
//             // console.log("\nThis is create POST Collection: ", addToPostsCollection)


//             res.status(200).json({ message: "Post Created", redirect: `${process.env.G_REDIRECT_URI}/r/${communityExists.name}` })
//         } catch (error) {
//             console.error("Error in creating post", error.message)
//             res.status(500).json({ error: "Internal Server Error" })
//         }
//     })

// })
router.post("/create", async (req, res) => {
    tempStorePosts(req, res, async function (err) {
        if (err) {
            console.error("Multer error: ", err);
            return res.status(500).json({ error: "File upload failed" });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { title, body, communityId, author, contentType } = req.body;

            const community = await Community.findById(communityId).session(session);
            if (!community) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ error: "Community not found" });
            }

            const user = await User.findById(author).session(session);
            if (!user) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ error: "User not found" });
            }

            const postData = { title, body, community: communityId, author };
            const newPost = await Post.create([postData], { session });

            const postCollection = await PostsCollection.findById(communityId).session(session);
            if (!postCollection) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ error: "Post collection not found" });
            }

            postCollection.posts.unshift({ postId: newPost[0]._id });
            await postCollection.save({ session });

            const commentCollection = await PostCommentCollection.create([{ _id: newPost[0]._id }], { session });
            await Post.findByIdAndUpdate(newPost[0]._id, { comments: commentCollection[0]._id }, { session });

            const voteCollection = await CommunityPostAndCommentVote.create([{ postId: newPost[0]._id }], { session });
            await Post.findByIdAndUpdate(newPost[0]._id, { vote: voteCollection[0]._id }, { session });

            // Handle multiple media files
            if (req.files && req.files['media']) {
                const mediaArray = [];

                for (const file of req.files['media']) {
                    const { mediaUrl } = await uploadPostMedia(community._id.toString(), [file], req, false);
                    if (mediaUrl) {
                        mediaArray.push({ type: contentType, url: mediaUrl });
                    }
                }

                if (mediaArray.length > 0) {
                    newPost[0].media = mediaArray;
                    await newPost[0].save({ session });
                }
            }

            await session.commitTransaction();
            session.endSession();

            res.status(200).json({ message: "Post created successfully", redirect: `${process.env.G_REDIRECT_URI}/r/${community.name}` });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("Error creating post:", error.message);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });
});



// Create a comment for a post
router.post("/create-comment", async (req, res) => {
    const { postId, author, body } = req.body;

    try {

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });


        const newComment = new PostComment({
            postId,
            author,
            body
        });


        await newComment.save();


        const postCommentCollection = await PostCommentCollection.findById(post.comments);
        postCommentCollection.comments.push(newComment._id);
        await postCommentCollection.save();


        post.commentsCount += 1;
        await post.save();


        const voteCollection_create = await CommunityPostAndCommentVote.create({
            commentId: newComment._id
        })

        voteCollection_create.save()


        const newCommentCreated = await PostComment.findById({ _id: newComment._id })
        newCommentCreated.vote = voteCollection_create._id

        newCommentCreated.save()

        await newCommentCreated.populate({
            path: 'vote',
            populate: 'upVotesCount downVotesCount upvotes downvotes',
        })
        // console.log(newCommentCreated)
        res.status(200).json({ message: "Comment added successfully", comment: newCommentCreated });
    } catch (error) {
        console.error("Error adding comment", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});






// Create reply on a comment for a post
router.post("/reply-comment", async (req, res) => {
    const { postId, commentId, author, body } = req.body;

    try {

        const postComment = await PostComment.findById({ _id: commentId });
        if (!postComment) return res.status(404).json({ error: "Post not found" });


        const newComment = new PostComment({
            postId,
            parentComment: commentId,
            author,
            body
        });
        await newComment.save();

        postComment.replies.push(newComment._id)
        await postComment.save();



        const voteCollection_create = await CommunityPostAndCommentVote.create({
            commentId: newComment._id
        })

        voteCollection_create.save()


        const newCommentCreated = await PostComment.findById({ _id: newComment._id })
        newCommentCreated.vote = voteCollection_create._id

        newCommentCreated.save()

        await newCommentCreated.populate({
            path: 'vote',
            populate: 'upvotes downvotes upVotesCount downVotesCount',

        })

        // console.log(newCommentCreated)
        res.status(200).json({ message: "Reply added successfully", comment: newCommentCreated });
    } catch (error) {
        console.error("Error adding comment", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});









router.post("/get-replies", async (req, res) => {
    const { commentId } = req.body;

    try {

        const postComment = await PostComment.findById({ _id: commentId })
            .populate({
                path: "replies",

                populate: {
                    path: 'vote',
                    select: 'upVotesCount downVotesCount upvotes downvotes',
                }
            })
            .populate(
                {
                    path: "replies",
                    populate: {
                        path: "author",
                        select: 'name profilePic universityEmailVerified personalEmailVerified personalEmail universityEmail'
                    },

                }
            ).exec()

        if (!postComment) return res.status(404).json({ error: "Post not found" });
        // console.log(postComment.replies)


        // const replies = postComment.replies.


        res.status(200).json({ message: "Reply added successfully", comment: postComment.replies });
    } catch (error) {
        console.error("Error adding comment", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



//for commetns , can be used for post by modifcation. do comment rn
router.post("/vote", async (req, res) => {
    const { commentId, voteType } = req.body;

    try {
        const userId = req.session.user;

        const checkVoteInPostComment = await PostComment.findById({ _id: commentId })
        if (!checkVoteInPostComment) return res.status(404).json({ error: "Post Comment not found" });
        // console.log(checkVoteInPostComment)



        const checkVoteInPostComment_VoteCollection = await CommunityPostAndCommentVote.findOne({ commentId: commentId })
        if (!checkVoteInPostComment_VoteCollection) return res.status(404).json({ error: "Post Comment Vote not found" });
        // console.log(checkVoteInPostComment_VoteCollection)

        if (voteType === 'upvote') {
            checkVoteInPostComment_VoteCollection.upvotes.includes(userId._id) ?
                checkVoteInPostComment_VoteCollection.upvotes.pop(userId._id) :
                checkVoteInPostComment_VoteCollection.upvotes.push(userId._id)

            checkVoteInPostComment_VoteCollection.downvotes.includes(userId._id) &&
                checkVoteInPostComment_VoteCollection.downvotes.pop(userId._id)

        } else if (voteType === 'downvote') {

            checkVoteInPostComment_VoteCollection.downvotes.includes(userId._id) ?
                checkVoteInPostComment_VoteCollection.downvotes.pop(userId._id) :
                checkVoteInPostComment_VoteCollection.downvotes.push(userId._id)


            checkVoteInPostComment_VoteCollection.upvotes.includes(userId._id) &&
                checkVoteInPostComment_VoteCollection.upvotes.pop(userId._id)



        }

        checkVoteInPostComment_VoteCollection.upVotesCount = checkVoteInPostComment_VoteCollection.upvotes.length
        checkVoteInPostComment_VoteCollection.downVotesCount = checkVoteInPostComment_VoteCollection.downvotes.length

        checkVoteInPostComment_VoteCollection.save()
        const upVotesCount = checkVoteInPostComment_VoteCollection.upvotes.length
        const downVotesCount = checkVoteInPostComment_VoteCollection.downvotes.length


        // console.log("te->", checkVoteInPostComment_VoteCollection)
        res.status(200).json({ message: "Voted", upVotesCount, downVotesCount });
    } catch (error) {
        console.error("Error adding comment", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// could be one code but better keep it different, vote post
router.post("/vote-post", async (req, res) => {
    const { postId, voteType } = req.body;

    try {
        const userId = req.session.user;

        const checkVoteInPost = await Post.findById({ _id: postId })
        if (!checkVoteInPost) return res.status(404).json({ error: "Post not found" });
        // console.log("Post ", checkVoteInPost)



        const checkVoteInPost_VoteCollection = await CommunityPostAndCommentVote.findById({ _id: checkVoteInPost.vote._id })
        if (!checkVoteInPost_VoteCollection) return res.status(404).json({ error: "Post Vote not found" });
        // console.log("Post Collection", checkVoteInPost_VoteCollection)

        if (voteType === 'upvote') {
            checkVoteInPost_VoteCollection.upvotes.includes(userId._id) ?
                checkVoteInPost_VoteCollection.upvotes.pop(userId._id) :
                checkVoteInPost_VoteCollection.upvotes.push(userId._id)

            checkVoteInPost_VoteCollection.downvotes.includes(userId._id) &&
                checkVoteInPost_VoteCollection.downvotes.pop(userId._id)

        } else if (voteType === 'downvote') {

            checkVoteInPost_VoteCollection.downvotes.includes(userId._id) ?
                checkVoteInPost_VoteCollection.downvotes.pop(userId._id) :
                checkVoteInPost_VoteCollection.downvotes.push(userId._id)


            checkVoteInPost_VoteCollection.upvotes.includes(userId._id) &&
                checkVoteInPost_VoteCollection.upvotes.pop(userId._id)



        }

        const up_vote = checkVoteInPost_VoteCollection.upvotes.length
        const down_vote = checkVoteInPost_VoteCollection.downvotes.length

        checkVoteInPost_VoteCollection.upVotesCount = up_vote;
        checkVoteInPost_VoteCollection.downVotesCount = down_vote;

        checkVoteInPost_VoteCollection.save()
        checkVoteInPost.downvotes = down_vote;
        checkVoteInPost.upvotes = up_vote;

        checkVoteInPost.save()
        const upVotesCount = checkVoteInPost_VoteCollection.upvotes.length
        const downVotesCount = checkVoteInPost_VoteCollection.downvotes.length


        // console.log("te->", checkVoteInPostComment_VoteCollection)
        res.status(200).json({ message: "Voted", upVotesCount, downVotesCount });
    } catch (error) {
        console.error("Error adding comment", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});






router.post("/get-post-votes", async (req, res) => {
    const { postId } = req.body;
    // console.log(postId)
    try {
        const userId = req.session.user;

        const checkVoteInPost = await Post.findById({ _id: postId })
        if (!checkVoteInPost) return res.status(404).json({ error: "Post not found" });
        // console.log("Post ", checkVoteInPost)



        const checkVoteInPost_VoteCollection = await CommunityPostAndCommentVote.findById({ _id: checkVoteInPost.vote._id })
        if (!checkVoteInPost_VoteCollection) return res.status(404).json({ error: "Post Vote not found" });
        // console.log("Post Collection", checkVoteInPost_VoteCollection)

        let hasUpVoted = false;
        let hasDownVoted = false;
        if (checkVoteInPost_VoteCollection.upvotes.includes(userId._id)) {
            hasUpVoted = true
            hasDownVoted = false

        } else if (checkVoteInPost_VoteCollection.downvotes.includes(userId._id)) {
            hasUpVoted = false
            hasDownVoted = true
        }


        res.status(200).json({ message: "fetched", hasUpVoted, hasDownVoted });
    } catch (error) {
        console.error("Error adding comment", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});






router.get('/get-random-community-and-sub-posts', async (req, res) => {

    try {
        const threeDaysAgo = new Date(new Date() - (3 * 24 * 60 * 60 * 1000));

        const getCommunities = await Post.find({ createdAt: { $gte: threeDaysAgo } }).populate({
            path: "community subCommunity author",
            select: "icon name username profilePic universityEmailVerified personalEmailVerified"
        }).sort({ createdAt: -1 })//.limit(10)
        // console.log("GEt", getCommunities)
        res.status(200).json(getCommunities)
    } catch (error) {
        console.error("Error message from /get-random-community-and-sub-posts: ", error.message)
    }
})

module.exports = router;