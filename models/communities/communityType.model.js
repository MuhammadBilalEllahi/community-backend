const { default: mongoose } = require("mongoose");
const Schema = mongoose.Schema


const communityTypeSchema = new Schema({

    communityType: {
        type: String,
        enum: ["public", "private", "restricted"],
        required: true
    },
    memberCount: {
        type: Number,
        default: 0
    }
});

const CommunityType = mongoose.model("CommunityType", communityTypeSchema);
module.exports = CommunityType;
