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

        const commentDetails = await PostCommentCollection.findById({ _id: postId }).populate({
            path: 'comments',
            select: 'comments'
        })
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
module.exports = router;