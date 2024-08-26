const { default: mongoose } = require("mongoose");
const Schema = mongoose.Schema


const membersSchema = new Schema({

    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },

    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],

});

const Members = mongoose.model("Members", membersSchema);
module.exports = Members;
