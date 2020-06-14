const express = require('express');
const { check } = require('express-validator');
// const fileUpload = require('../middleware/file-upload');
const registroController = require('../controllers/registroController');
const fileUpload = require('express-fileupload');

const router = express.Router();
router.use(fileUpload());

router.post('/newClient', registroController.newClient);

router.post('/newBusiness', registroController.newBusiness);

router.get('/verifyEmail/:email', registroController.verifyEmailExist)

module.exports = router;