const express = require('express')
const checkout = require('../middleware/check-auth');
const clientController = require('../controllers/clientController');

const router = express.Router();


// router.use(checkout)

router.post('/checkout', clientController.checkout);
router.get('/businesses', clientController.getBusinesses);
router.get('/getBusiness/:idBusiness', clientController.getBusiness);
router.get('/getClient/:clientId', clientController.getLoggedClient);
router.patch('/updateClient/:clientId', clientController.updateClient);
router.patch('/updatePassword/:clientId', clientController.updatePassword);
router.route('/businesses/:lat/:lng').get(clientController.getBusinesses);



module.exports = router