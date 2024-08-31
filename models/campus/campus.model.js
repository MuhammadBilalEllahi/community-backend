const mongoose = require('mongoose')
const { Schema, model } = mongoose;

const campusSchema = new Schema({
    location: {
        type: String,
        enum: ['Lahore', 'Abbottabad', 'Vehari', 'Islamabad', 'All'],
    },
    campusTeachers: [{ type: Schema.Types.ObjectId, ref: 'Teacher' }],
    communities: [{ type: Schema.Types.ObjectId, ref: 'Community' }],
    subCommunities: [{ type: Schema.Types.ObjectId, ref: 'SubCommunity' }],
    posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }]//should only be according to Location
})

const Campus = model("Campus", campusSchema)
module.exports = Campus;