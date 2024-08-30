const express = require("express");
const Community = require("../../models/communities/community.model");
const Members = require("../../models/communities/members.model");
const CommunityType = require("../../models/communities/communityType.model");
const User = require("../../models/user/user.model");
const PostsCollection = require("../../models/communities/postsCollection.model");
const SubCommunity = require("../../models/communities/sub.community.model");
const { tempStore } = require("../../utils/multer.util");
const { uploadCommunityImages, uploadSubCommunityImages } = require("../../utils/aws.bucket.util");
const Campus = require("../../models/campus/campus.model");
const router = express.Router()

router.post("/create", async (req, res) => {
    tempStore(req, res, async function (err) {
        if (err) {
            console.error("Multer error: ", err);
            return res.status(500).json({ error: "File upload failed" });
        }

        try {

            const { communityName, description, topics, communityType, creatorId } = req.body;

            const communityTypeFound = await CommunityType.findOne({ communityType: communityType })
            if (!communityTypeFound) return res.status(404).json({ error: "Not found Type" })


            const userFound = await User.findById({ _id: creatorId })
            if (!userFound) return res.status(404).json({ error: "Not found User" })

            const community = await Community.create(
                {
                    name: communityName,
                    description: description,
                    creator: creatorId,
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
            await community.save()


            const postCollection = await PostsCollection.create({ _id: community._id })
            postCollection.save()

            userFound.subscribedCommunities.push(community._id)
            userFound.save()


            // uploadCommunityImages(community._id, req.files)
            const { bannerUrl, iconUrl } = await uploadCommunityImages(community._id, req.files);


            // const banner = req.files['banner'] ? req.files['banner'][0].filename : null;
            // const icon = req.files['icon'] ? req.files['icon'][0].filename : null;
            // console.log("\n banner ->", bannerUrl, "\n icon ->", iconUrl)
            if (bannerUrl) {
                community.banner = bannerUrl
            }

            if (iconUrl) {
                community.icon = iconUrl
            }
            await community.save()




            res.status(200).json({ message: "Community Created", redirect: `${process.env.G_REDIRECT_URI}/r/${community.name}?isSubCommunity=false` })




        } catch (error) {
            console.error("Error while creating community", error.message)
            res.status(500).json({ error: "Internal Server Error" })
        }
    })
});





// create subcommuntiy in community
router.post("/create-sub", async (req, res) => {
    tempStore(req, res, async function (err) {
        if (err) {
            console.error("Multer error: ", err);
            return res.status(500).json({ error: "File upload failed" });
        }



        try {

            const { parent, communityName, description, banner, icon, topics, communityType, creatorId } = req.body;


            // console.log("communityName", communityName, "\n",
            //     "description", description, "\n",
            //     "banner", banner, "\n",
            //     "icon", icon, "\n",
            //     "topics", topics,
            //     "\n", "communityType", communityType,
            //     "\n", "creator", creatorId,
            //     "\n", "parent", parent)

            const parentCommunity = await Community.findById({ _id: parent })
            if (!parentCommunity) return res.status(404).json({ error: "Does This Parent Communtiy Exists?" })

            // const communityNameLowercased = communityName.toString().toLowerCase() //not using this

            const isInCommunityCollection = await Community.findOne({ name: communityName })
            if (isInCommunityCollection) return res.status(404).json({ error: "This Exists as Communtiy, can not add as Sub community " })


            const existsInSubCommunity = await SubCommunity.findOne({ name: communityName })
            if (existsInSubCommunity) return res.status(404).json({ error: "This  Sub-Communtiy Exists" })


            const communityTypeFound = await CommunityType.findOne({ communityType: communityType })
            if (!communityTypeFound) return res.status(404).json({ error: "Not found Type" })


            const userFound = await User.findById({ _id: creatorId })
            if (!userFound) return res.status(404).json({ error: "Not found User" })

            const subCommunity = await SubCommunity.create(
                {
                    name: communityName,
                    description: description,
                    creator: creatorId,
                    topics: topics,
                    communityType: communityTypeFound._id,
                    totalMembers: 1,
                    moderators: [creatorId],
                    parent: parentCommunity._id
                }
            )



            const members = await Members.create({
                communityId: subCommunity._id,
                members: [creatorId]
            })

            members.save()
            subCommunity.members = members._id
            subCommunity.save()

            parentCommunity.subCommunities.push(subCommunity._id)
            parentCommunity.save()

            const postCollection = await PostsCollection.create({ _id: subCommunity._id })
            postCollection.save()

            userFound.subscribedSubCommunities.push(subCommunity._id)
            userFound.save()


            const { bannerUrl, iconUrl } = await uploadSubCommunityImages(subCommunity._id, req.files)
            // console.log("\n banner ->", bannerUrl, "\n icon ->", iconUrl)

            if (bannerUrl) {
                subCommunity.banner = bannerUrl
            }

            if (iconUrl) {
                subCommunity.icon = iconUrl
            }

            await subCommunity.save()


            res.status(200).json({ message: "Community Created", redirect: `${process.env.G_REDIRECT_URI}/r/${subCommunity.name}?isSubCommunity=true` })


        } catch (error) {
            console.error("Error while creating community", error.message)
            res.status(500).json({ error: "Internal Server Error" })
        }
    });
});

//fecthes sub communities from community for sidebar, no need rn i think
router.get('/sub-communities', async (req, res) => {
    const { communityId } = req.params

    try {
        const subCommunities = await Community.findById({ _id: communityId })
        if (!subCommunities) return res.status(404).json({ error: "Error Fetching records" });
        res.status(200).json(subCommunities);

    } catch (error) {
        console.error("Error in already get community", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})










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
        // const communities = await Community.find().populate('subCommunities')
        const communities =
            await Campus.findOne({ location: req.session.user.profile.location })
                .select('communities')
                .populate('communities')
                .populate({
                    path: 'communities',
                    populate: ['subCommunities']
                })

        // .populate({
        //     path: 'communities.subCommunities',
        //     populate: 'subCommunities'
        // })

        // console.log("Communities: ", communities.communities.map(t => t))

        if (!communities) return res.status(404).json({ error: "Error Fetching records" });
        res.status(200).json(communities.communities);

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
        const checkIfComIsPrivate = await Community.findById(communityId)
            .select('communityType').populate('communityType', 'communityType')
        // console.log(checkIfComIsPrivate.communityType.communityType)

        if (checkIfComIsPrivate.communityType.communityType === 'private') {
            const members = await Members.findOne({ communityId: communityId }).select('members')
            if (!members.members.some(mem => mem.equals(req.session.user._id))) {
                // console.log("is not member")
                return res.status(204).json({ message: 'Join This Private Community Now' })
            }
        }

        const postFromCommunities = await PostsCollection.findById({ _id: communityId }).select("posts")
            .populate({
                path: "posts.postId",
                populate: {
                    path: "author",
                    select: 'name personalEmail personalEmailVerified universityEmail universityEmailVerified _id'
                }
            })
        // console.log("Community posts", postFromCommunities)
        if (!postFromCommunities) return res.status(404).json({ error: "Error Fetching records" });

        // const sortedPosts = postFromCommunities.posts.sort((a, b) => (new Date(a.createdAt) - new Date(b.createdAt))); // old first 
        const sortedPosts = postFromCommunities.posts.sort((a, b) => (new Date(b.createdAt) - new Date(a.createdAt))); //latest first
        // console.log("Community posts", sortedPosts)


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
        // console.log(userSubscribtions)
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




module.exports = router;