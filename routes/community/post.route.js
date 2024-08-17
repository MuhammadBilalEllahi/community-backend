const express = require("express");
const Post = require("../../models/communities/post.model");
const PostsCollection = require("../../models/communities/postsCollection.model");
const router = express.Router()


router.post("/create", async (req, res) => {
    const { title, body, communityId, author } = req.body;
    try {

        const createPost = await Post.create(
            {
                title: title,
                body: body,
                community: communityId,
                author: author
            }
        )
        createPost.save()

        if (communityId === author) {
            return;
        }
        const addToPostsCollection = await PostsCollection.findById({ _id: communityId })
        if (!addToPostsCollection) return res.status(404).json({ error: "Error Occured" })

        addToPostsCollection.posts.push({
            postId: createPost._id,
            title: title,
            snippet: body

        })

        addToPostsCollection.save()
        res.status(200).json({ message: "Post created" })
    } catch (error) {
        console.error("Error in creating post", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }


})
module.exports = router;