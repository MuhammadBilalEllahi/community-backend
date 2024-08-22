// const app = require('express');
const multer = require('multer');


const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        console.log("Milter Dest: ", file)
        return cb(null, `./data/uploads`)// let error be null rn. later add req.session.user protectRoute
    },
    filename: function (req, file, cb) {
        console.log("Milter File: ", file)
        return cb(null, `${req.session.user._id}-${file.originalname}-${Date.now()}`)
    }
})

const upload = multer({ storage: storage })

module.exports = { upload }