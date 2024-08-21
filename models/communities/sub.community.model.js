const mongoose = require("mongoose");
const { Schema, model } = mongoose;


const subCommunitySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
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
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    moderators: [{
        type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
        ref: 'CommunityType',
        required: true
    },
    totalMembers: {
        type: Number,
        default: 0
    },
    members: {
        type: Schema.Types.ObjectId,
        ref: 'Members',
        // required: true
    },
    postsCollectionRef: {
        type: Schema.Types.ObjectId, ref: "PostsCollection"
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: "Community",

    },

});

const SubCommunity = mongoose.model("SubCommunity", subCommunitySchema);
module.exports = SubCommunity;

// validate: {
//     validator: function (value) {
//         return !(value && value.length > 0 && this.parent)
//     },
//     message: "A community with sub-communities cannot have a parent."
// }

// validate: {
//     validator: function (value) {
//         return !(value && this.subCommunities && this.subCommunities.length > 0)
//     },
//     message: "A community with a parent cannot have sub-communities."
// }