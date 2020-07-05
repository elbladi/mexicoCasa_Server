const express = require('express')
const clientController = require('../controllers/clientController');
const { authRole } = require('../middleware/auth');
const { ROLE } = require('../util/permissions/roles');

const router = express.Router();

router.post('/checkout', authRole(ROLE.CUSTOMER), clientController.checkout);
router.get('/businesses', authRole(ROLE.CUSTOMER), clientController.getBusinesses);
router.get('/getBusiness/:idBusiness', authRole(ROLE.CUSTOMER), clientController.getBusiness);
router.get('/getClient/:clientId', authRole(ROLE.CUSTOMER), clientController.getLoggedClient);
router.patch('/updateClient/:clientId', authRole(ROLE.CUSTOMER), clientController.updateClient);
router.patch('/updatePassword/:clientId', authRole(ROLE.CUSTOMER), clientController.updatePassword);
router.route('/businesses/:lat/:lng').get(clientController.getBusinesses);
router.get('/getClientNamePhone/:clientId', clientController.getClientNamePhone);

module.exports = router