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
 *     tags:
 *       - Wallet
 *     summary: Initialize wallet funding
 *     description: Starts a wallet funding transaction and returns a payment reference
 *     security:
 *       - bearerAuth: []
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
 *         description: Wallet funding initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 reference:
 *                   type: string
 *                   example: FUND_123456789
 *                 amount:
 *                   type: number
 *                   example: 10000
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/fund', secure, fundWalletInit);


module.exports = router;