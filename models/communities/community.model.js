const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const communitySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    moderators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    rules: [
        {
            title: { type: String },
            description: { type: String },
        },
    ],
    banner: { type: String },
    icon: { type: String },
    topics: [{ type: String }],
    communityType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommunityType',
        required: true
    },
    totalMembers: {
        type: Number,
        default: 0
    },
    members: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Members',
        // required: true
    }
});

const Community = mongoose.model("Community", communitySchema);
module.exports = Community;
