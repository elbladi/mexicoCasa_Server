const express = require('express');
const homeController = require('../controllers/homeController');

const router = express.Router();

router.get('/login/getUserType/:userId', homeController.getUserType);
router.post('/login', homeController.login); 

module.exports = router;