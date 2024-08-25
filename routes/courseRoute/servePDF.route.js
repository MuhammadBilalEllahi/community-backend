const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')


router.get('/:year/:subject/:type/:filename', (req, res) => {
    // console.log("Here",)
    const { year, subject, type, filename } = req.params;
    const filePath = path.join(__dirname, "..", "..", 'pastpapers', year, subject, type, filename);

    fs.access(filePath, fs.constants.F_OK,
        (err) => {
            if (err) {
                console.error('Error: File not found', err);
                res.status(404).send('File not found');
                return;
            }
        }
    )

    const fileStream = fs.createReadStream(filePath)

    fileStream.on('error', (streamErr) => {
        console.error('Error streaming the file:', streamErr);
        res.status(500).send('Error reading the file');
    })

    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    fileStream.pipe(res);

    // res.sendFile(filePath, (err) => {
    //     if (err) {
    //         console.log('Error serving the file:', err);
    //         res.status(404).send('File not found');
    //     }
    // });
});

module.exports = router