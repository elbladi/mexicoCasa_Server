const express = require('express');
const checkout = require('../middleware/check-auth');

const negocioController = require('../controllers/negocioController');
const productsController = require('../controllers/productsController');

const router = express.Router();

// router.use(checkout);

router.get('/pedidos/:negId', negocioController.getPedidos);
router.get('/getNegocio/:negId', negocioController.getNegocioDetails);
router.get('/pedidos/preparando/:negId', negocioController.getPreparando);
router.get('/pedidos/ready/:negId', negocioController.getFinished);
router.post('/updateOrder', negocioController.updateStage);


router.get('/getProducts/:negId', productsController.getProducts);
router.post('/addProduct', productsController.addProduct);

module.exports = router;