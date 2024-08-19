const express = require("express");
const Post = require("../../models/communities/post.model");
const PostsCollection = require("../../models/communities/postsCollection.model");
const User = require("../../models/user/user.model");
const Community = require("../../models/communities/community.model");
const PostComment = require("../../models/communities/comment.model");
const PostCommentCollection = require("../../models/communities/commentCollection");
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
        //.populate('comments.author')
        // console.log(commentDetails)
        res.status(200).json(commentDetails)

    } catch (error) {
        console.error("Error in creating post", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})





//set latest post in community (unshift )
router.post("/create", async (req, res) => {
    const { title, body, communityId, author } = req.body;
    // console.log({ title, body, communityId, author })
    try {
        const communityExists = await Community.findById({ _id: communityId })
        if (!communityExists) return res.status(404).json({ error: "Error Occured Finding this Community" })
        // console.log(communityExists)
        const user = await User.findById({ _id: author })
        if (!user) return res.status(404).json({ error: "Error Occured, Are you signed In?" })
        // console.log(user)
        const createPost = await Post.create(
            {
                title: title,
                body: body,
                community: communityId,
                author: author
            }
        )
        createPost.save()
        // console.log(createPost)
        if (communityId === author) {
            return;
        }
        const addToPostsCollection = await PostsCollection.findById({ _id: communityId })
        if (!addToPostsCollection) return res.status(404).json({ error: "Error Occured, who delted post collection record" })

        addToPostsCollection.posts.unshift({
            postId: createPost._id,
            title: title,
            snippet: body,
            author: user.name

        })

        addToPostsCollection.save()

        const createCommentCollection = await PostCommentCollection.create({ _id: createPost._id })
        createCommentCollection.save()

        // console.log(addToPostsCollection)
        // console.log(createCommentCollection)


        const updatePostToAddCommentId = await Post.findByIdAndUpdate(createPost._id,
            {
                comments: createCommentCollection._id
            },
        )
        // console.log("updatePostToAddCommentId", updatePostToAddCommentId)

        res.status(200).json({ message: "Post Created", redirect: `${process.env.G_REDIRECT_URI}/r/${communityExists.name}` })
    } catch (error) {
        console.error("Error in creating post", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }


})



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

        res.status(200).json({ message: "Comment added successfully", comment: newComment });
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

        res.status(200).json({ message: "Reply added successfully", comment: newComment });
    } catch (error) {
        console.error("Error adding comment", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});









router.post("/get-replies", async (req, res) => {
    const { commentId } = req.body;

    try {

        const postComment = await PostComment.findById({ _id: commentId }).populate(
            {
                path: "replies",
                populate: {
                    path: "author",
                    select: 'name profilePic universityEmailVerified personalEmailVerified personalEmail universityEmail'
                },
            }
        );
        if (!postComment) return res.status(404).json({ error: "Post not found" });
        console.log(postComment.replies)


        // const replies = postComment.replies.


        res.status(200).json({ message: "Reply added successfully", comment: postComment.replies });
    } catch (error) {
        console.error("Error adding comment", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



module.exports = router;