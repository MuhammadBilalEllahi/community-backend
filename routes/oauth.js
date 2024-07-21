var express = require('express');
var router = express.Router();
const dotenv = require('dotenv');
const { getOAuthClient } = require('../controllers/oauth.controller');
dotenv.config();


router.get('/', getOAuthClient)


module.exports = router;