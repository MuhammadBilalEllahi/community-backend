const { default: mongoose } = require("mongoose");

const fileSchema = new mongoose.Schema({
    pdf: String,
    // image: String, //better use pdf only
});

const yearSchema = new mongoose.Schema({
    year: { type: Number, required: true },
    fall: {
        lab: [fileSchema],
        theory: [fileSchema]
    },
    spring: {
        lab: [fileSchema],
        theory: [fileSchema]
    },
    // subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
});

const Year = mongoose.model("Year", yearSchema);

module.exports = { Year }