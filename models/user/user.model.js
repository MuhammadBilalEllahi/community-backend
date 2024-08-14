const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    universityEmail: {
        type: String,
        required: function () {
            return !this.personalEmail;
        },
        match: [
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/,
            "Please fill a valid email address",
        ],
    },
    personalEmail: {
        type: String,
        required: function () {
            return !this.universityEmail;
        },
        match: [
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/,
            "Please fill a valid email address",
        ],
    },

    secondaryPersonalEmail: {
        type: String,
        match: [
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/,
            "Please fill a valid email address",
        ],
    },

    phoneNumber: {
        type: String,
        match: [/^\d{10,15}$/, "Please fill a valid phone number"],
    },

    universityEmailVerified: {
        type: Boolean,
        default: false,
    },
    personalEmailVerified: {
        type: Boolean,
        default: false,
    },
    secondaryPersonalEmailVerified: {
        type: Boolean,
        default: false,
    },

    universityEmailExpirationDate: {
        type: Date,
    },

    google_EmailVerified: {
        type: Boolean,
        default: false,
    },












    karma: {
        postKarma: { type: Number, default: 0 },
        commentKarma: { type: Number, default: 0 }
    },

    profile: {
        bio: { type: String, default: '' },
        avatar: { type: String, default: '' },
        location: { type: String, default: '' },
        website: { type: String, default: '' }
    },

    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],

    subscribedCommunities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }],














    username: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        enum: ["male", "female"],
    },
    profilePic: {
        type: String,
        default: "",
    },
    urls: [String],
    token: {
        type: String,
        default: ''
    },
    refresh_token: {
        type: String,
        default: ''
    },
    access_token: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.pre("save", async function (next) {
    // if (!this.username) {

    //     let generatedUsername = this.name.toLowerCase().replace(/\s+/g, '_');
    //     let usernameExists = await mongoose.models.User.findOne({ username: generatedUsername });
    //     let suffix = 1;
    //     while (usernameExists) {
    //         generatedUsername = `${this.name.toLowerCase().replace(/\s+/g, '_')}_${suffix}`;
    //         usernameExists = await mongoose.models.User.findOne({ username: generatedUsername });
    //         suffix++;
    //     }
    //     this.username = generatedUsername;
    // }
    this.updatedAt = Date.now();
    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
