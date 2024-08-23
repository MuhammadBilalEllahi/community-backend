const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');



const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// const generatePresignedUrl = async (bucketName, key) => { nah this is one time stuff
//     try {
//         const command = new GetObjectCommand({
//             Bucket: bucketName,
//             Key: key,
//         });

//         const url = await getSignedUrl(s3Client, command, { expiresIn: 2 * 3600 });
//         return url;
//     } catch (err) {
//         console.error('Error generating presigned URL:', err);
//         throw err;
//     }
// };

const uploadToS3 = async (filePath, bucketName, key, ContentType) => {
    try {
        const fileContent = fs.readFileSync(filePath);

        const params = {
            Bucket: bucketName,
            Key: key,
            Body: fileContent,
            ContentType: ContentType,
            ACL: "public-read-write"
        };

        const command = new PutObjectCommand(params);
        const response = await s3Client.send(command);

        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (err) {
        console.error('Error uploading file to S3:', err);
        throw err;
    }
};

const uploadCommunityImages = async (communityId, files) => {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    try {
        let bannerUrl = null;
        let iconUrl = null;

        if (files['banner']) {
            const bannerFile = files['banner'][0];
            const bannerKey = `community/${communityId}/banner/${Date.now()}-${bannerFile.filename}`;
            bannerUrl = await uploadToS3(bannerFile.path, bucketName, bannerKey, 'image/jpeg');
        }

        if (files['icon']) {
            const iconFile = files['icon'][0];
            const iconKey = `community/${communityId}/icon/${Date.now()}-${iconFile.filename}`;
            iconUrl = await uploadToS3(iconFile.path, bucketName, iconKey, 'image/jpeg');
        }

        return { bannerUrl, iconUrl };
    } catch (error) {
        console.error('Error uploading images to S3:', error);
        throw error;
    }
};

module.exports = { uploadCommunityImages };




// const AWS = require('aws-sdk');
// const fs = require('fs');
// const path = require('path');

// const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
// const s3Client = new S3Client({ region: process.env.AWS_REGION });



// const s3 = new AWS.S3({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: 
// });


// const uploadToS3 = (filePath, bucketName, key) => {
//     return new Promise((resolve, reject) => {
//         fs.readFile(filePath, (err, data) => {
//             if (err) return reject(err);

//             const params = {
//                 Bucket: bucketName,
//                 Key: key,
//                 Body: data,
//                 ContentType: 'image/jpeg'
//             };

//             s3.upload(params, (err, data) => {
//                 if (err) return reject(err);
//                 resolve(data.Location);
//             });
//         });
//     });
// };

// const uploadCommunityImages = async (communityId, files) => {
//     const bucketName = process.env.AWS_S3_BUCKET_NAME;

//     try {
//         let bannerUrl = null;
//         let iconUrl = null;

//         if (files['banner']) {
//             const bannerFile = files['banner'][0];
//             const bannerKey = `community/${communityId}/banner/${Date.now()}-${bannerFile.filename}`;
//             bannerUrl = await uploadToS3(bannerFile.path, bucketName, bannerKey);
//         }

//         if (files['icon']) {
//             const iconFile = files['icon'][0];
//             const iconKey = `community/${communityId}/icon/${Date.now()}-${iconFile.filename}`;
//             iconUrl = await uploadToS3(iconFile.path, bucketName, iconKey);
//         }

//         return { bannerUrl, iconUrl };
//     } catch (error) {
//         console.error('Error uploading images to S3:', error);
//         throw error;
//     }
// };


// (node:7622) NOTE: The AWS SDK for JavaScript (v2) will enter maintenance mode
// on September 8, 2024 and reach end-of-support on September 8, 2025.

// Please migrate your code to use AWS SDK for JavaScript (v3).
// For more information, check blog post at https://a.co/cUPnyil
// (Use `node --trace-warnings ...` to show where the warning was created)
// module.exports = { uploadCommunityImages }