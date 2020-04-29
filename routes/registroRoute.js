const express = require('express');
const checkout = require('../middleware/check-auth');
const { check } = require('express-validator');
const fileUpload = require('../middleware/file-upload');
const registroController = require('../controllers/registroController');

const router = express.Router();


router.post('/newClient',
    // [
    //     check('name').not().isEmpty(),
    //     check('apellidos').not().isEmpty(),
    //     check('email').normalizeEmail().isEmail(),
    //     check('password').not().isEmpty(),
    //     check('telefono').isLength({ min: 10 }),
    //     check('direccion').not().isEmpty(),
    //     check('fotoINE').not().isEmpty
    // ],
    registroController.newClient);


router.post('/newBusiness',
    // [
    //     check('nameResponsable').not().isEmpty(),
    //     check('apellidos').not().isEmpty(),
    //     check('email').normalizeEmail().isEmail(),
    //     check('password').not().isEmpty(),
    //     check('telefono').isLength({ min: 10 }),
    //     check('name').not().isEmpty(),
    //     check('direccion').not().isEmpty(),
    //     check('desc').not().isEmpty(),
    //     check('fotoNegocio').not().isEmpty(),
    //     check('fotoINE').not().isEmpty(),

    // ], 
    registroController.newBusiness);

router.use(checkout);


module.exports = router;