const express = require('express')
const router = express.Router()
const path = require('path')

router.get('/:year/:subject/:type/:filename', (req, res) => {
    console.log("Here",)
    const { year, subject, type, filename } = req.params;
    const filePath = path.join(__dirname, "..", "..", 'pastpapers', year, subject, type, filename);


    res.sendFile(filePath, (err) => {
        if (err) {
            console.log('Error serving the file:', err);
            res.status(404).send('File not found');
        }
    });
});

module.exports = router