const { default: mongoose } = require("mongoose");

const voteSchema = new Schema({

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // or use commentId if voting on a comment

    commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" }, // Use this if voting on a comment

    voteType: { type: String, enum: ["upvote", "downvote"], required: true },

    createdAt: { type: Date, default: Date.now },

});

const Vote = mongoose.model("Vote", voteSchema);
module.exports = Vote;
