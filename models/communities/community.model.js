const { default: mongoose } = require("mongoose");

const communitySchema = new Schema({

    name: { type: String, required: true, unique: true },

    // title: { type: String, required: true }, // not needed

    description: { type: String, required: true },

    createdAt: { type: Date, default: Date.now },

    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    rules: [
        {
            title: { type: String, required: true },
            description: { type: String, required: true },
        },
    ],

    members: { type: Number, default: 0 },

});

const Community = mongoose.model("Community", communitySchema);
module.exports = Community;
