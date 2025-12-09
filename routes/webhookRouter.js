const express = require('express');
const router = express.Router();
const { webhook } = require('../controllers/webhookController');

router.post('/', webhook);

module.exports = router;
