const express = require('express')
const checkout = require('../middleware/check-auth');
const clientController = require('../controllers/clientController');

const router = express.Router();


// router.use(checkout)

router.post('/checkout', clientController.checkout);


module.exports = router