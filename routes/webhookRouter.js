const express = require('express');
const router = express.Router();
const { webhook } = require('../controllers/webhookController');

router.post('/korapay', express.json({ type: '*/*'}), webhook);

module.exports = router;
