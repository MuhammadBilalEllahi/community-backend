const { default: mongoose } = require("mongoose");

const discussionSchema = new mongoose.Schema({
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    discussion_of: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
}, { timestamps: true });

const Discussion = mongoose.model('Discussion', discussionSchema);
module.exports = Discussion;