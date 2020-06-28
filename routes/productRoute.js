const express = require('express');
const fileUpload = require('express-fileupload');
const { authRole } = require('../middleware/auth');
const { ROLE } = require('../util/permissions/roles');

const productsController = require('../controllers/productsController');

const router = express.Router();
router.use(fileUpload());

router.get('/getProducts/:negId', productsController.getProducts);
router.post('/addProduct', authRole(ROLE.BUSINESS), productsController.addProduct);
router.patch('/updateProduct/:negId', authRole(ROLE.BUSINESS), productsController.updateProduct);
router.delete('/deleteProduct/', authRole(ROLE.BUSINESS), productsController.deleteProduct);

module.exports = router;