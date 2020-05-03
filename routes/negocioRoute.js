const express = require('express');
const checkout = require('../middleware/check-auth');

const negocioController = require('../controllers/negocioController');

const router = express.Router();

router.get('/pedidos/:negId', negocioController.getPedidos);
router.get('/pedidos/preparando/:negId', negocioController.getPreparando);
router.get('/pedidos/ready/:negId', negocioController.getFinished);
router.post('/updateOrder', negocioController.updateStage);

module.exports = router;