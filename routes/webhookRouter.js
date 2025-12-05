const express = require('express');
const router = express.Router();
const { webhook } = require('../controllers/webhookController');

router.post('/korapay', express.raw({ type: 'application/json'}), webhook);

module.exports = router;
