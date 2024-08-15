const express = require("express");
const Community = require("../../models/communities/community.model");
const Members = require("../../models/communities/members.model");
const CommunityType = require("../../models/communities/communityType.model");
const User = require("../../models/user/user.model");
const router = express.Router()


router.post("/create", async (req, res) => {
    const { communityName, description, banner, icon, topics, communityType, creatorId } = req.body;

    try {
        console.log("communityName", communityName, "\n",
            "description", description, "\n",
            "banner", banner, "\n",
            "icon", icon, "\n",
            "topics", topics,
            "\n", "communityType", communityType,
            "\n", "creator", creatorId)


        const communityNameLowercased = communityName.toString().toLowerCase()
        const communityTypeFound = await CommunityType.findOne({ communityType: communityType })
        if (!communityTypeFound) return res.status(404).json({ error: "Not found Type" })


        const userFound = await User.findById({ _id: creatorId })
        if (!userFound) return res.status(404).json({ error: "Not found User" })

        const community = await Community.create(
            {
                name: communityNameLowercased,
                description: description,
                creator: creatorId,
                banner: banner.preview,
                icon: icon.preview,
                topics: topics,
                communityType: communityTypeFound._id,
                totalMembers: 1,
                moderators: [creatorId]
            }
        )

        // community.moderators.push(creatorId)// redundant

        const members = await Members.create({
            communityId: community._id,
            members: [creatorId]
        })
        // members.members.push(creatorId) //redundant
        members.save()
        community.members = members._id
        community.save()

        res.status(200).json({ message: "Community Created", community })

    } catch (error) {
        console.log("Error while creating community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
});

router.get('/has-this-community', async (req, res) => {
    const { communityName } = req.query;
    try {

        // console.log("This is ", communityName)
        const communityNameLowercased = communityName.toString().toLowerCase()
        const communityExists = await Community.findOne({ name: communityNameLowercased })
        if (communityExists) return res.status(200).json({ exists: true });
        res.status(200).json({ exists: false });

    } catch (error) {
        console.log("Error in already created community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})



router.get('/communities', async (req, res) => {

    try {


        const communities = await Community.find()
        if (!communities) return res.status(404).json({ error: "Error Fetching records" });
        res.status(200).json(communities);

    } catch (error) {
        console.log("Error in already get community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

router.post('/community-data', async (req, res) => {
    const { communityName } = req.body;
    try {
        // console.log("community name ", communityName)

        const community = await Community.findOne({ name: communityName }).populate(
            {
                path: "moderators",
                select: "name profilePic"
            }
        )
        if (!community) return res.status(404).json({ error: "Error Fetching records" });
        res.status(200).json(community);

    } catch (error) {
        console.log("Error in already get community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})



module.exports = router;