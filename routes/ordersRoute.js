const express = require('express');
const router = express.Router();

const { ROLE } = require('../util/permissions/roles');
const { authRole } = require('../middleware/auth')

const ordersController = require('../controllers/orderController');

router.get('/:negId', authRole(ROLE.BUSINESS), ordersController.getPedidos);
router.patch('/updateOrder', authRole(ROLE.BUSINESS), ordersController.updateStage);
router.get('/preparando/:negId', authRole(ROLE.BUSINESS), ordersController.getPreparando);
router.get('/ready/:negId', authRole(ROLE.BUSINESS), ordersController.getFinished);


module.exports = router;