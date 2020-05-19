const express = require('express');
const homeController = require('../controllers/homeController');

const router = express.Router();

router.post('/login', homeController.login); 

module.exports = router;