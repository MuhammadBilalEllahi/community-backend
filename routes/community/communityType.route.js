const express = require('express');
const CommunityType = require('../../models/communities/communityType.model');

const router = express.Router();



router.post('/create-community-types', async (req, res) => {
    try {

        const publicMember = await CommunityType.create({
            communityType: "public",
            totalPublic: 0,
        });

        const privateMember = await CommunityType.create({
            communityType: "private",
            totalPrivate: 0,
        });

        const restrictedMember = await CommunityType.create({
            communityType: "restricted",
            totalRestricted: 0,
        });

        res.status(201).json({
            message: "Members entries created successfully",
            data: {
                publicMember,
                privateMember,
                restrictedMember
            }
        });
    } catch (error) {
        console.error("Error while creating member entries:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
