const express = require('express');
const router = express.Router();
const {fundWalletInit} = require('../controllers/walletController');
const { secure } = require('../middleware/authMiddleware');

router.post('/fund', secure, fundWalletInit);

module.exports = router;