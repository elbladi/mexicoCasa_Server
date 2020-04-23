const express = require('express');

const clientController = require('../controllers/clientController');

const router = express.Router();

router.post('/newClient', clientController.newClient);

module.exports = router;