const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
