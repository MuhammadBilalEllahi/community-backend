const Discussion = require("../../models/discussion/discussion.model")



const getDiscussions = async (req, res) => {

    try {
        const discussion = await Discussion.find()
        if (!discussion) return res.status(404).json({ message: "No Discussion Found" })
        res.status(200).json({ discussion })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}


const getDiscussionOfId = async (req, res) => {
    const { id } = req.params
    try {
        const discussion = await Discussion.findOne({ discussion_of: id })
        if (!discussion) return res.status(404).json({ message: "No Discussion Found" })

        res.status(200).json({ discussion })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const populateReplies = (path, depth) => {
    if (depth === 0) {
        return { path };
    }
    return {
        path,
        populate: [{
            path: 'replies',
            populate: populateReplies('replies', depth - 1)
        },
        {
            path: 'user',
            select: 'name profilePic universityEmail personalEmail universityEmailVerified updatedAt personalEmailVerified '
        }]
    };
};
const createDiscussionIfNotCreated = async (req, res) => {
    const { toBeDisccusedId } = req.query

    try {
        const discussion = await Discussion.findOne({ discussion_of: toBeDisccusedId }).populate({
            path: 'comments',
            populate: [{
                path: 'user',
                select: 'name profilePic universityEmail personalEmail universityEmailVerified updatedAt personalEmailVerified '
            },
            populateReplies("replies", 10)]
        })
        // const discussion = await Discussion.findOne({ discussion_of: toBeDisccusedId }).populate({
        //     path: 'comments',
        //     populate: {
        //         path: 'replies',
        //         populate: {
        //             path: 'replies',
        //             populate: {
        //                 path: 'replies'
        //             }
        //         }
        //     }
        // })
        if (discussion) return res.status(200).json({ discussion })

        const createDiscussion = await Discussion.create({
            discussion_of: toBeDisccusedId
        })

        res.status(200).json({ createDiscussion })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = {
    getDiscussions,
    getDiscussionOfId,
    createDiscussionIfNotCreated
}