var express = require('express');
var router = express.Router();
const dotenv = require('dotenv');
const { getOAuthClient, getUserDataFetch } = require('../controllers/oauth.controller');
dotenv.config();


router.get('/', getOAuthClient)
router.get('/name', getUserDataFetch)



module.exports = router;