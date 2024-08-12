const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const campusSchema = new Schema({
    location: {
        type: String,
        enum: ['Lahore', 'Abbottabad', 'Vehari', 'Islamabad'],
    }
})

const Campus = mongoose.model("Campus", campusSchema)
module.exports = Campus;