const express = require('express');
const router = express.Router();
const { korapayWebhook } = require('../controllers/webhookController'); // Path to where you saved the webhook logic


router.post('/korapay', korapayWebhook);

module.exports = router;