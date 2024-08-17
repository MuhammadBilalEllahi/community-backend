const express = require("express");
const Community = require("../../models/communities/community.model");
const Members = require("../../models/communities/members.model");
const CommunityType = require("../../models/communities/communityType.model");
const User = require("../../models/user/user.model");
const PostsCollection = require("../../models/communities/postsCollection.model");
const router = express.Router()

//create a community from frontend
router.post("/create", async (req, res) => {
    const { communityName, description, banner, icon, topics, communityType, creatorId } = req.body;

    try {
        // console.log("communityName", communityName, "\n",
        //     "description", description, "\n",
        //     "banner", banner, "\n",
        //     "icon", icon, "\n",
        //     "topics", topics,
        //     "\n", "communityType", communityType,
        //     "\n", "creator", creatorId)


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


        const postCollection = await PostsCollection.create({ _id: community._id })
        postCollection.save()

        userFound.subscribedCommunities.push(community._id)
        userFound.save()

        res.status(200).json({ message: "Community Created", community })

    } catch (error) {
        console.error("Error while creating community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
});


// checks if community name already exists while creating community
router.get('/has-this-community', async (req, res) => {
    const { communityName } = req.query;
    try {

        // console.log("This is ", communityName)
        const communityNameLowercased = communityName.toString().toLowerCase()
        const communityExists = await Community.findOne({ name: communityNameLowercased })
        if (communityExists) return res.status(200).json({ exists: true });
        res.status(200).json({ exists: false });

    } catch (error) {
        console.error("Error in already created community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})


//fecthes communities for sidebar
router.get('/communities', async (req, res) => {

    try {


        const communities = await Community.find()
        if (!communities) return res.status(404).json({ error: "Error Fetching records" });
        res.status(200).json(communities);

    } catch (error) {
        console.error("Error in already get community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

//this get func, checks subscribed communities of user to post new content on any community
router.get('/user-subscribed', async (req, res) => {
    // const { userId } = req.body
    const userId = req.session.user._id

    try {


        const subscribedCommunities = await User.findOne({ _id: userId }).select('subscribedCommunities').populate({ path: 'subscribedCommunities', select: 'name _id icon' })
        // console.log(subscribedCommunities)
        if (!subscribedCommunities) return res.status(404).json({ error: "Error Fetching records" });
        res.status(200).json(subscribedCommunities);

    } catch (error) {
        console.error("Error in already get community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

//returns community data and their mod info
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
        console.error("Error in already get community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

// returns post of that community whose id is given in request body
router.post('/posts', async (req, res) => {
    const { communityId } = req.body;
    // console.log("Community Id", communityId)
    try {
        const postFromCommunities = await PostsCollection.findById({ _id: communityId })
        // console.log("Community posts", postFromCommunities.posts)
        if (!postFromCommunities) return res.status(404).json({ error: "Error Fetching records" });

        // const sortedPosts = postFromCommunities.posts.sort((a, b) => b.createdAt - a.createdAt); // old first
        const sortedPosts = postFromCommunities.posts.sort((b, a) => b.createdAt - a.createdAt); //latest first

        res.status(200).json(sortedPosts);

    } catch (error) {

        console.error("Error in  get posts from  community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})


//checking if user is joined to community or not
router.get('/is-user-joined', async (req, res) => {
    const { communityId } = req.query;
    const userId = req.session.user._id;

    try {
        const userSubscribtions = await User.findOne({ _id: userId }).select('subscribedCommunities -_id').populate({ path: 'subscribedCommunities', select: '_id' })
        console.log(userSubscribtions)
        if (!userSubscribtions) return res.status(404).json({ error: "Error Fetching records" });

        const isSubscribed = userSubscribtions.subscribedCommunities.some(
            community => community._id.toString() === communityId
        );

        res.status(200).json({ message: isSubscribed })

    } catch (error) {
        console.error("Error in already get community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})



//checking if user is "joined then leave", or "join if not joined" to community 
router.post('/join-or-leave', async (req, res) => {
    const { communityId } = req.query;
    const userId = req.session.user._id;

    try {
        const user = await User.findById(userId).select('subscribedCommunities');
        if (!user) return res.status(404).json({ error: "User not found" });

        const community = await Community.findById(communityId).populate('members');
        if (!community) return res.status(404).json({ error: "Community not found" });

        const isSubscribed = user.subscribedCommunities.some(
            community => community.toString() === communityId
        );

        if (isSubscribed) {
            // remove user from subscribedCommunities and community's members list
            user.subscribedCommunities = user.subscribedCommunities.filter(
                community => community.toString() !== communityId
            );
            community.members.members = community.members.members.filter(
                member => member.toString() !== userId
            );
            community.totalMembers = Math.max(0, community.totalMembers - 1);
        } else {
            // ad user to subscribedCommunities and community's members list
            user.subscribedCommunities.push(communityId);
            community.members.members.push(userId);
            community.totalMembers += 1;
        }

        // save the updated documents
        await user.save();
        await community.members.save();
        await community.save();

        res.status(200).json({ message: isSubscribed ? false : true });
        // res.status(200).json({ message: isSubscribed ? 'Left the community' : 'Joined the community' });

    } catch (error) {
        console.error("Error in join-or-leave operation", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// router.post('/join-or-leave', async (req, res) => {
//     const { communityId } = req.query;
//     const userId = req.session.user._id;

//     try {
//         const userSubscribtions = await User.findOne({ _id: userId }).select('subscribedCommunities -_id').populate({ path: 'subscribedCommunities', select: '_id' })
//         console.log(userSubscribtions)
//         if (!userSubscribtions) return res.status(404).json({ error: "Error Fetching records" });



//         let isSubscribed = userSubscribtions.subscribedCommunities.some(
//             community => community._id.toString() === communityId
//         );


//         if (isSubscribed) {
//             userSubscribtions.subscribedCommunities.pop(communityId)

//             const community = await Community.findById({ _id: communityId })
//             if (!community.members._id) return;

//             const communityMember = await Members.findById({ _id: community.members._id })
//             communityMember.members.pop(userId)
//             community.totalMembers === 0 ? community.totalMembers = 0 : community.totalMembers -= 1
//             communityMember.save()
//         } else {
//             userSubscribtions.subscribedCommunities.push(communityId)

//             const community = await Community.findById({ _id: communityId })
//             if (!community.members._id) return;

//             const communityMember = await Members.findById({ _id: community.members._id })
//             communityMember.members.push(userId)
//             community.totalMembers += 1
//             communityMember.save()
//         }

//         res.status(200).json({ message: isSubscribed })

//     } catch (error) {
//         console.error("Error in already get community", error.message)
//         res.status(500).json({ error: "Internal Server Error" })
//     }
// })

module.exports = router;