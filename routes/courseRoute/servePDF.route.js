const express = require('express');
const router = express.Router();
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const stream = require('stream');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});


// const { ListObjectsV2Command } = require('@aws-sdk/client-s3');

// const s3Params = {
//     Bucket: process.env.AWS_S3_BUCKET_NAME,
//     Prefix: 'pastpapers/Computer Science/CSC462/Artificial Intelligence/SP24/FINAL/THEORY/SP24-AI-FINAL.pdf'
// };

// const f = async () => {
//     try {
//         const command = new ListObjectsV2Command(s3Params);
//         const data = await s3Client.send(command);
//         // console.log('S3 Files:', data.Contents);
//     } catch (err) {
//         console.error('Error listing S3 objects:', err);
//     }

// }
// f()

router.get('/:department/:courseId/:subject/:year/:type/:scheme/:filename', async (req, res) => {
    const { department, courseId, subject, year, type, scheme, filename } = req.params;
    // console.log("Data: ", department, courseId, subject, year, type, scheme, filename)
    // console.log("URl to fetch ", `pastpapers/${department}/${courseId}/${subject}/${year}/${type}/${scheme}/${filename}`)
    const key = `pastpapers/${department}/${courseId}/${subject}/${year}/${type}/${scheme}/${filename}`
    key.replace('%20', ' ')
    // console.log("replaced value: ", key)
    const s3Params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key
    };

    try {
        const command = new GetObjectCommand(s3Params);
        const s3Response = await s3Client.send(command);


        const passThrough = new stream.PassThrough();
        stream.pipeline(s3Response.Body, passThrough, (err) => {
            if (err) {
                console.error('Error streaming the file:', err);
                res.status(500).send('Error streaming the file');
            }
        });

        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');
        passThrough.pipe(res);
    } catch (err) {
        console.error('Error fetching the file from S3:', err);
        res.status(404).send('File not found');
    }
});




router.post('/upload/user-request', upload.single('file'), async (req, res) => {
    const { department, courseId, subject, year, type, scheme } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded');
    }

    const s3Params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `pastpapers/${department}/${courseId}/${subject}/${year}/${type}/${scheme}/${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        const command = new PutObjectCommand(s3Params);
        await s3Client.send(command);
        res.status(200).send('File uploaded successfully');
    } catch (err) {
        console.error('Error uploading file to S3:', err);
        res.status(500).send('Error uploading file');
    }
});



module.exports = router;
