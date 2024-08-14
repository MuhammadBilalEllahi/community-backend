const { default: mongoose } = require("mongoose");

const reportSchema = new Schema({
    reportedItemId: { type: mongoose.Schema.Types.ObjectId, required: true },  // Could refer to Post, Comment, etc.

    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    reason: { type: String, required: true },

    createdAt: { type: Date, default: Date.now },

    status: { type: String, enum: ['open', 'closed'], default: 'open' }
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
