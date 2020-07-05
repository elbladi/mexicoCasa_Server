const express = require('express');

const negocioController = require('../controllers/negocioController');
const { authRole } = require('../middleware/auth');
const { ROLE } = require('../util/permissions/roles');

const router = express.Router();

router.get('/getNegocio/:negId', negocioController.getNegocioDetails);
router.post('/updWithImage/:negId', authRole(ROLE.BUSINESS),  negocioController.updateBusinessWithPhoto);
router.post('/updWithoutImage/:negId', authRole(ROLE.BUSINESS), negocioController.updateBusinessWithoutPhoto);
router.patch('/update/:negId', authRole(ROLE.BUSINESS), negocioController.updateBusiness);

module.exports = router;