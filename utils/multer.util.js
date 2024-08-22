const path = require('path');
const fs = require('fs');
const multer = require('multer');

const tempStore = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const tempDir = path.join(__dirname, "..", 'data', 'uploads', 'temp');
            fs.mkdirSync(tempDir, { recursive: true });

            return cb(null, tempDir)
        },
        filename: function (req, file, cb) {

            return cb(null, `${Date.now()}-${file.fieldname}-${file.originalname}`);

        }
    })
}).fields([{ name: 'banner', maxCount: 1 }, { name: 'icon', maxCount: 1 }]);

const uploadCommunityImages = (communityId, files) => {
    return new Promise((resolve, reject) => {
        try {
            const communityDir = path.join(__dirname, "..", 'data', 'uploads', 'community', communityId.toString());

            const bannerDir = path.join(communityDir, 'banner');
            const iconDir = path.join(communityDir, 'icon');

            fs.mkdirSync(bannerDir, { recursive: true });
            fs.mkdirSync(iconDir, { recursive: true });


            if (files['banner']) {
                const bannerFile = files['banner'][0];
                const newBannerPath = path.join(bannerDir, bannerFile.filename);
                fs.renameSync(bannerFile.path, newBannerPath);
            }
            if (files['icon']) {
                const iconFile = files['icon'][0];

                const newIconPath = path.join(iconDir, iconFile.filename);
                fs.renameSync(iconFile.path, newIconPath);
            }

            // Object.values(files).forEach(fileArray => {
            //     fileArray.forEach(file => {
            //         fs.unlinkSync(file.path);
            //     });
            // });

            resolve();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { uploadCommunityImages, tempStore }



// const uploadCommunityImages = (communityId) => {
//     return multer({
//         storage: multer.diskStorage({

//             destination: function (req, file, cb) {
//                 console.log("Milter Dest: ", file, "\n REQ.bodr\n", req.body)
//                 console.log("Vommunity ", communityId)

//                 let dir = path.join(__dirname, "..", 'data', 'uploads', 'community', communityId);
//                 if (file.fieldname === 'banner') {
//                     dir = path.join(dir, 'banner')
//                     console.log("banner", dir)
//                 } else if (file.fieldname === 'icon') {
//                     dir = path.join(dir, 'icon')
//                     console.log("icon", dir)
//                 } else {
//                     dir = path.join(dir, "corrupted")
//                 }

//                 fs.mkdirSync(dir, { recursive: true });

//                 console.log("Multer Destination: ", dir);


//                 return cb(null, dir)// let error be null rn. later add req.session.user protectRoute
//             },
//             filename: function (req, file, cb) {
//                 console.log("Milter File: ", file)
//                 return cb(null, `${communityId}-${file.fieldname}-${Date.now()}-${file.originalname}`)
//             }
//         })
//     }).fields([{ name: 'banner', maxCount: 1 }, { name: 'icon', maxCount: 1 }])
// }







// const storage = multer.diskStorage({

//     destination: function (req, file, cb) {
//         console.log("Milter Dest: ", file, req.body)
//         console.log("Vommunity ", communityId)
//         // const dir = path.join(__dirname,)
//         // if (file.fieldname)
//         //     fs.mkdirSync()
//         return cb(null, `./data/uploads`)// let error be null rn. later add req.session.user protectRoute
//     },
//     filename: function (req, file, cb) {
//         console.log("Milter File: ", file)
//         return cb(null, `${req.session.user._id}-${file.fieldname}-${Date.now()}-${file.originalname}`)
//     }
// })

// const upload = multer({ storage: storage })





//create a community from frontend
// const cpUpload = upload.fields([{ name: 'banner', maxCount: 1 }, { name: 'icon', maxCount: 1 }])
