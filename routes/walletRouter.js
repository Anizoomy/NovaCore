const express = require('express');
const router = express.Router();
const {fundWalletInit} = require('../controllers/walletController');
const { secure } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet operations
 */

/**
 * @swagger
 * /fund:
 *   post:
 *     summary: Initialize wallet funding
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Wallet funding initialized
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 */
router.post('/fund', secure, fundWalletInit);

module.exports = router;