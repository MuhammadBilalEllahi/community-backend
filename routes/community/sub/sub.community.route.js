const express = require("express");
const CommunityType = require("../../../models/communities/communityType.model");
const SubCommunity = require("../../../models/communities/sub.community.model");
const Members = require("../../../models/communities/members.model");
const PostsCollection = require("../../../models/communities/postsCollection.model");
const User = require("../../../models/user/user.model");

const router = express.Router()

//create a community from frontend
router.post("/create", async (req, res) => {// NOT BEING USED
    const { communityName, description, banner, icon, topics, communityType, creatorId } = req.body;

    try {
        // console.log("communityName", communityName, "\n",
        //     "description", description, "\n",
        //     "banner", banner, "\n",
        //     "icon", icon, "\n",
        //     "topics", topics,
        //     "\n", "communityType", communityType,
        //     "\n", "creator", creatorId)


        // const communityNameLowercased = communityName.toString().toLowerCase()
        const communityTypeFound = await CommunityType.findOne({ communityType: communityType })
        if (!communityTypeFound) return res.status(404).json({ error: "Not found Type" })


        const userFound = await User.findById({ _id: creatorId })
        if (!userFound) return res.status(404).json({ error: "Not found User" })

        const subCommunity = await SubCommunity.create(
            {
                name: communityName,
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
            communityId: subCommunity._id,
            members: [creatorId]
        })
        // members.members.push(creatorId) //redundant
        members.save()
        subCommunity.members = members._id
        subCommunity.save()


        const postCollection = await PostsCollection.create({ _id: subCommunity._id })
        postCollection.save()

        userFound.subscribedSubCommunities.push(subCommunity._id)
        userFound.save()


        res.status(200).json({ message: "Sub Community Created", redirect: `${process.env.G_REDIRECT_URI}/r/sub/${subCommunity.name}?isSubCommunity=true` })


    } catch (error) {
        console.error("Error while creating community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
});















// checks if community name already exists while creating community
router.get('/has-this-sub-community', async (req, res) => {
    const { communityName, parentId } = req.query;
    try {

        console.log("This is ", communityName, parentId)
        // const communityNameLowercased = communityName.toString().toLowerCase()
        const communityExists = await SubCommunity.findOne({ name: communityName }).where({ parent: parentId })
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
        const subCommunities = await SubCommunity.find()
        if (!subCommunities) return res.status(404).json({ error: "Error Fetching records" });
        res.status(200).json(subCommunities);

    } catch (error) {
        console.error("Error in already get sub community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

//this get func, checks subscribed communities of user to post new content on any community
router.get('/user-subscribed', async (req, res) => {
    // const { userId } = req.body
    const userId = req.session.user._id

    try {


        const subscribedCommunities = await User.findOne({ _id: userId }).select('subscribedSubCommunities').populate({ path: 'subscribedSubCommunities', select: 'name _id icon' })
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

        const subCommunity = await SubCommunity.findOne({ name: communityName }).populate(
            {
                path: "moderators",
                select: "name profilePic"
            }
        )
        if (!subCommunity) return res.status(404).json({ error: "Error Fetching records" });
        res.status(200).json(subCommunity);

    } catch (error) {
        console.error("Error in already get subCommunity", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

// returns post of that community whose id is given in request body
router.post('/posts', async (req, res) => {
    const { communityId } = req.body;
    // console.log("Community Id", communityId)
    try {
        const postFromCommunities = await PostsCollection.findById({ _id: communityId }).select("posts")
            .populate({
                path: "posts.postId",
                populate: {
                    path: "author",
                    select: 'name personalEmail personalEmailVerified universityEmail universityEmailVerified _id'
                }
            })

        // console.log("Sub Community posts", postFromCommunities)
        if (!postFromCommunities) return res.status(404).json({ error: "Error Fetching records" });

        // const sortedPosts = postFromCommunities.posts.sort((a, b) => (new Date(a.createdAt) - new Date(b.createdAt))); // old first 
        const sortedPosts = postFromCommunities.posts.sort((a, b) => (new Date(b.createdAt) - new Date(a.createdAt))); //latest first
        // console.log("Sub Community posts", sortedPosts)


        res.status(200).json(sortedPosts);

    } catch (error) {

        console.error("Error in  get posts from sub community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})


//checking if user is joined to community or not
router.get('/is-user-joined', async (req, res) => {
    const { communityId } = req.query;
    const userId = req.session.user._id;

    try {
        const userSubscribtions = await User.findOne({ _id: userId }).select('subscribedSubCommunities -_id').populate({ path: 'subscribedSubCommunities', select: '_id' })
        // console.log(userSubscribtions, communityId)
        if (!userSubscribtions) return res.status(404).json({ error: "Error Fetching records" });
        let isSubscribed = false
        if (userSubscribtions.subscribedSubCommunities.length > 0) {
            isSubscribed = userSubscribtions.subscribedSubCommunities.some(
                subCommunity => subCommunity._id.toString() === communityId
            );
        }

        res.status(200).json({ message: isSubscribed })

    } catch (error) {
        console.error("Error in already get subCommunity", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})



//checking if user is "joined then leave", or "join if not joined" to community 
router.post('/join-or-leave', async (req, res) => {
    const { communityId } = req.query;
    const userId = req.session.user._id;

    try {
        const user = await User.findById(userId).select('subscribedSubCommunities');
        if (!user) return res.status(404).json({ error: "User not found" });

        const subCommunity = await SubCommunity.findById(communityId).populate('members');
        if (!subCommunity) return res.status(404).json({ error: "Community not found" });

        const isSubscribed = user.subscribedSubCommunities.some(
            subCommunity => subCommunity.toString() === communityId
        );

        if (isSubscribed) {
            // remove user from subscribedSubCommunities and subCommunity's members list
            user.subscribedSubCommunities = user.subscribedSubCommunities.filter(
                subCommunity => subCommunity.toString() !== communityId
            );
            subCommunity.members.members = subCommunity.members.members.filter(
                member => member.toString() !== userId
            );
            subCommunity.totalMembers = Math.max(0, subCommunity.totalMembers - 1);
        } else {
            // ad user to subscribedSubCommunities and subCommunity's members list
            user.subscribedSubCommunities.push(communityId);
            subCommunity.members.members.push(userId);
            subCommunity.totalMembers += 1;
        }

        // save the updated documents
        await user.save();
        await subCommunity.members.save();
        await subCommunity.save();

        res.status(200).json({ message: isSubscribed ? false : true });
        // res.status(200).json({ message: isSubscribed ? 'Left the subCommunity' : 'Joined the subCommunity' });

    } catch (error) {
        console.error("Error in join-or-leave operation", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




module.exports = router;