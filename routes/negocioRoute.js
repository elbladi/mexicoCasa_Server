const express = require('express');

const negocioController = require('../controllers/negocioController');
const fileUpload = require('express-fileupload');

const router = express.Router();
router.use(fileUpload());

router.get('/pedidos/:negId', negocioController.getPedidos);
router.get('/getNegocio/:negId', negocioController.getNegocioDetails);
router.get('/pedidos/preparando/:negId', negocioController.getPreparando);
router.get('/pedidos/ready/:negId', negocioController.getFinished);
router.post('/updateOrder', negocioController.updateStage);
router.post('/updWithImage/:negId', negocioController.updateBusinessWithPhoto);
router.post('/updWithoutImage/:negId', negocioController.updateBusinessWithoutPhoto);
router.patch('/update/:negId', negocioController.updateBusiness);

module.exports = router;