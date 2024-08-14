const { default: mongoose } = require("mongoose");

const postSchema = new Schema({

    title: { type: String, required: true },
    body: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
        required: true,
    },

    createdAt: { type: Date, default: Date.now },

    upvotes: { type: Number, default: 0 },

    downvotes: { type: Number, default: 0 },

    commentsCount: { type: Number, default: 0 },

    media: {
        type: {
            type: String,
            enum: ["image", "video", "link", "text"],
            default: "text",
        },
        url: { type: String, default: "" },
    },

    flair: { type: String, default: "" },

    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],

    editedAt: { type: Date },
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
