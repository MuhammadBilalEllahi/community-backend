const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const postSchema = new Schema({
    title: { type: String, required: true },
    body: { type: String },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    community: { type: Schema.Types.ObjectId, ref: "Community", required: function () { return !this.subCommunity; }, index: true },
    subCommunity: { type: Schema.Types.ObjectId, ref: "SubCommunity", required: function () { return !this.community; }, index: true },

    createdAt: { type: Date, default: Date.now },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    vote: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityPostAndCommentVote" },
    commentsCount: { type: Number, default: 0 },
    media: {
        type: {
            type: String,
            enum: ["image", "video", "video/*", "video/mp4", "link", "text", "image/jpeg", "image/png", "image/*"],
            default: "text",
        },
        url: { type: String, default: "" },
    },
    flair: { type: String, default: "" },
    comments: { type: Schema.Types.ObjectId, ref: "PostCommentCollection" },

    editedAt: { type: Date },
},
    { timestamps: true }, {

    validate: {
        validator: function () {
            return !(this.community && this.subCommunity);
        },
        message: 'You cannot set both community and subCommunity. Choose one.'
    }
}
);

const Post = model("Post", postSchema);
module.exports = Post;
