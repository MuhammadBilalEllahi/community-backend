const { default: mongoose } = require("mongoose");

const commentSchema = new Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },  // For nested comments
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    editedAt: { type: Date }
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
