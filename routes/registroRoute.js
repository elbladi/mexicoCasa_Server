const express = require('express');
const checkout = require('../middleware/check-auth');
const { check } = require('express-validator');
const fileUpload = require('../middleware/file-upload');
const registroController = require('../controllers/registroController');

const router = express.Router();


router.post('/newClient',
    fileUpload.single('image'),
    [
        check('name').not().isEmpty(),
        check('apellidos').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('telefono').isLength({ min: 10 }),
        check('direccion').not().isEmpty()
    ],
    registroController.newClient);

// router.get('/newClient', registroController.newClient);

router.post('/newBussiness',
    [
        check('nameResponsable').not().isEmpty(),
        check('name').not().isEmpty(),
        check('direccion').not().isEmpty(),
        check('desc').not().isEmpty(),
        check('apellidos').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('telefono').isLength({ min: 10 })
    ], registroController.newBusiness);

router.use(checkout);


router.post('/newNegocio', registroController.newBusiness);


module.exports = router;