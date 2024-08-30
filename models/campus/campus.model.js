const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const campusSchema = new Schema({
    location: {
        type: String,
        enum: ['Lahore', 'Abbottabad', 'Vehari', 'Islamabad'],
    },
    campusTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }]
})

const Campus = mongoose.model("Campus", campusSchema)
module.exports = Campus;